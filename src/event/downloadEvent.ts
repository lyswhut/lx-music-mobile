import Event from '@/event/Event'

export class DownloadEvent extends Event {
  downloadListUpdate() {
    this.emit('downloadListUpdate')
  }

  downloadHistoryUpdate() {
    this.emit('downloadHistoryUpdate')
  }
}

type EventMethods = Omit<EventType, keyof Event>

declare class EventType extends DownloadEvent {
  on<K extends keyof EventMethods>(event: K, listener: EventMethods[K]): any
  off<K extends keyof EventMethods>(event: K, listener: EventMethods[K]): any
}

export type DownloadEventTypes = Omit<EventType, keyof Omit<Event, 'on' | 'off'>>
export const createDownloadEvent = (): DownloadEventTypes => {
  return new DownloadEvent()
}

export const downloadEvent = createDownloadEvent()
