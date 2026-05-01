import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  eventId: string;
  title: string;
  message: string;
  isSpam: boolean;
  wordCount: number;
  charCount: number;
  spamKeywordsFound: string[];
  timestamp: string;
  processedAt: string;
}

const EventSchema = new Schema<IEvent>(
  {
    eventId:           { type: String, required: true, unique: true },
    title:             { type: String, required: true },
    message:           { type: String, required: true },
    isSpam:            { type: Boolean, default: false },
    wordCount:         { type: Number, default: 0 },
    charCount:         { type: Number, default: 0 },
    spamKeywordsFound: { type: [String], default: [] },
    timestamp:         { type: String },
    processedAt:       { type: String },
  },
  { timestamps: true }
);

export const EventModel = mongoose.model<IEvent>('Event', EventSchema);
