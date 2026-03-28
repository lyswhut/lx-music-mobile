import Event from '@/event/Event'


class UserApiEvent extends Event {
  status_changed(status: { status: boolean, message?: string }) {
    this.emit('status_changed', status)
  }

  list_changed(list: LX.UserApi.UserApiInfo[]) {
    this.emit('list_changed', list)
  }
}


type EventMethods = Omit<EventType, keyof Event>


declare class EventType extends UserApiEvent {
  on<K extends keyof EventMethods>(event: K, listener: EventMethods[K]): any
  off<K extends keyof EventMethods>(event: K, listener: EventMethods[K]): any
}

type UserApiEventTypes = Omit<EventType, keyof Omit<Event, 'on' | 'off'>>


export const event: UserApiEventTypes = new UserApiEvent()
