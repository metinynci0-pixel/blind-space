import {
  QueueStrategy,
  TextToSpeech,
} from "@capacitor-community/text-to-speech";

export type NotificationPriority = 0 | 1 | 2 | 3 | 4;

export interface AnnouncementState {
  talkBackEnabled: boolean;
  speechRate: number;
  speechVolume: number;
}

export type AnnouncementStateReader = () => AnnouncementState;
export type LiveAnnouncementPublisher = (
  message: string,
  priority: NotificationPriority,
) => void;

interface QueuedAnnouncement {
  message: string;
  priority: NotificationPriority;
  sequence: number;
  getState: AnnouncementStateReader;
  publishLive: LiveAnnouncementPublisher;
  resolve: () => void;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function liveRegionDuration(message: string): number {
  const wordCount = message.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1200, Math.min(6000, wordCount * 320));
}

export class NotificationQueue {
  private pending: QueuedAnnouncement[] = [];
  private processing = false;
  private sequence = 0;
  private readonly recentMessages = new Map<
    string,
    { timestamp: number; priority: NotificationPriority }
  >();

  enqueue(
    message: string,
    priority: NotificationPriority,
    getState: AnnouncementStateReader,
    publishLive: LiveAnnouncementPublisher,
  ): Promise<void> {
    const normalizedMessage = message.trim();
    if (!normalizedMessage) {
      return Promise.resolve();
    }

    const now = Date.now();
    const previous = this.recentMessages.get(normalizedMessage);
    const dedupeWindow = priority <= 1 ? 2400 : 850;
    if (
      previous &&
      now - previous.timestamp < dedupeWindow &&
      priority >= previous.priority
    ) {
      return Promise.resolve();
    }

    for (const [recentMessage, entry] of this.recentMessages) {
      if (now - entry.timestamp > 60_000) {
        this.recentMessages.delete(recentMessage);
      }
    }
    this.recentMessages.set(normalizedMessage, { timestamp: now, priority });

    return new Promise((resolve) => {
      this.pending.push({
        message: normalizedMessage,
        priority,
        sequence: this.sequence++,
        getState,
        publishLive,
        resolve,
      });
      this.pending.sort(
        (left, right) =>
          left.priority - right.priority || left.sequence - right.sequence,
      );
      void this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;
    try {
      while (this.pending.length > 0) {
        const item = this.pending.shift();
        if (!item) {
          continue;
        }

        try {
          const state = item.getState();
          if (state.talkBackEnabled) {
            item.publishLive(item.message, item.priority);
            await wait(liveRegionDuration(item.message));
          } else {
            await TextToSpeech.speak({
              text: item.message,
              lang: "tr-TR",
              rate: state.speechRate,
              volume: state.speechVolume / 100,
              queueStrategy: QueueStrategy.Flush,
            });
          }
        } catch (error) {
          console.error("Bildirim seslendirilemedi.", error);
        } finally {
          item.resolve();
        }
      }
    } finally {
      this.processing = false;
      if (this.pending.length > 0) {
        void this.processQueue();
      }
    }
  }
}
