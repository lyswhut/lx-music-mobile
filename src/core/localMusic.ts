import { scanAudioFiles, readMetadata, type MusicMetadataFull } from '@/utils/localMediaMetadata'
import type { FileType } from '@/utils/fs'

/** 扫描上限，超出截断提示 */
const SCAN_MAX_MUSICS = 5000

/**
 * JNI 并发批次大小（readMetadata 涉及 JNI + ID3 解析）
 * 低端机可适当调小，高性能设备可调大
 */
const SCAN_BATCH_SIZE = 50

/**
 * 去重前置：按 (文件名 + 文件大小 + 修改时间) 对 FileType[] 去重
 * 发生在 readMetadata() 之前，避免无效 I/O
 */
function deduplicatePathItems(pathItems: FileType[]): FileType[] {
  const map = new Map<string, FileType>()
  for (const file of pathItems) {
    const key = `${file.name}||${file.size}||${file.lastModified}`
    const existing = map.get(key)
    if (!existing || file.lastModified > existing.lastModified) {
      map.set(key, file)
    }
  }
  return Array.from(map.values())
}

/**
 * 将单个音频文件路径转为 MusicInfoLocal
 * @param filePath     - 文件完整路径
 * @param fileName     - 文件名（不含路径）
 * @param fileSize     - 文件大小（字节），从 FileType 透传
 * @param lastModified - 文件修改时间戳，从 FileType 透传
 */
async function buildLocalMusicInfo(
  filePath: string,
  fileName: string,
  fileSize: number,
  lastModified: number
): Promise<LX.Music.MusicInfoLocal> {
  try {
    const metadata = await readMetadata(filePath)
    return {
      id: filePath,
      name: metadata?.name || fileName,
      singer: metadata?.singer || '',
      source: 'local',
      interval: metadata?.interval ? formatInterval(metadata.interval) : null,
      meta: {
        songId: filePath,
        filePath,
        albumName: metadata?.albumName || '',
        ext: metadata?.ext || '',
        picUrl: null,
        lastModified,
      },
    }
  } catch {
    // ID3 读取失败时降级：使用文件名作为歌名
    return {
      id: filePath,
      name: fileName,
      singer: '',
      source: 'local',
      interval: null,
      meta: {
        songId: filePath,
        filePath,
        albumName: '',
        ext: '',
        picUrl: null,
        lastModified,
      },
    }
  }
}

/** 将秒数格式化为 mm:ss */
function formatInterval(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * 扫描指定目录下的音频文件，去重后返回音乐列表
 */
export async function scanLocalMusics(
  dirPath: string
): Promise<{ musics: LX.Music.MusicInfoLocal[]; truncated: boolean }> {
  // 1. 扫描音频文件
  const files = await scanAudioFiles(dirPath)

  // 2. 去重前置（无需 I/O）
  const uniqueFiles = deduplicatePathItems(files)

  // 3. 截断保护
  let truncated = false
  const filesToProcess = uniqueFiles.slice(0, SCAN_MAX_MUSICS)
  if (uniqueFiles.length > SCAN_MAX_MUSICS) {
    truncated = true
  }

  // 4. 分批并行构建 MusicInfoLocal（控制 JNI 并发压力）
  const musics: LX.Music.MusicInfoLocal[] = []
  for (let i = 0; i < filesToProcess.length; i += SCAN_BATCH_SIZE) {
    const batch = filesToProcess.slice(i, i + SCAN_BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map(f =>
        buildLocalMusicInfo(f.path, f.name, f.size, f.lastModified)
      )
    )
    musics.push(...batchResults)
    // 每批处理后让出主线程，保持 UI 响应
    await new Promise(res => setTimeout(res, 0))
  }

  return { musics, truncated }
}
