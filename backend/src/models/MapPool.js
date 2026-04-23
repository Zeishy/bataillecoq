import mongoose from 'mongoose';

const mapPoolSchema = new mongoose.Schema({
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  // Modes with maps (optional - if empty, single-mode system)
  modes: [
    {
      name: {
        type: String,
        required: true,
        trim: true
      },
      order: {
        type: Number,
        default: 0
      },
      icon: String,
      maps: [
        {
          name: {
            type: String,
            required: true,
            trim: true
          },
          icon: String,
          imageUrl: String
        }
      ]
    }
  ],
  // Legacy: maps for single-mode games (used if no modes defined)
  maps: [
    {
      name: {
        type: String,
        required: true,
        trim: true
      },
      icon: String,
      imageUrl: String
    }
  ],
  formats: [
    {
      type: String,
      enum: ['bo1', 'bo3', 'bo5', 'bo7', 'bo9'],
      default: 'bo3'
    }
  ],
  sequences: [
    {
      format: { type: String, enum: ['bo1', 'bo3', 'bo5', 'bo7', 'bo9'] },
      steps: [
        {
          action: { type: String, enum: ['ban', 'pick', 'auto-pick'] },
          mode: String,
          teamRole: { type: String, enum: ['A', 'B', 'none'] }
        }
      ]
    }
  ],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for unique game + name combination
mapPoolSchema.index({ game: 1, name: 1 }, { unique: true });

export default mongoose.model('MapPool', mapPoolSchema);
