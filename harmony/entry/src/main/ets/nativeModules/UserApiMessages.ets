export interface UserScriptInfo {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  homepage: string;
  script: string;
}

export interface UserApiCommand {
  action: string;
  data?: string;
  preload?: string;
  info?: UserScriptInfo;
}

export interface UserApiEvent {
  action: string;
  data?: string;
  type?: string;
  log?: string;
}
