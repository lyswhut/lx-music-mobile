import Event from '@/event/Event'


class DislikeEvent extends Event {
  dislike_changed() {
    this.emit('dislike_changed')
  }
}


type EventMethods = Omit<EventType, keyof Event>


declare class EventType extends DislikeEvent {
  on<K extends keyof EventMethods>(event: K, listener: EventMethods[K]): any
  off<K extends keyof EventMethods>(event: K, listener: EventMethods[K]): any
}

type DislikeEventTypes = Omit<EventType, keyof Omit<Event, 'on' | 'off'>>


export const event: DislikeEventTypes = new DislikeEvent()
