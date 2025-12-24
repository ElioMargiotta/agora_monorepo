# Metadata Storage Architecture

This section describes the off-chain metadata storage system used in Agora for storing space descriptions, logos, and other non-blockchain data.

## Overview

Agora uses a hybrid storage approach:
- **On-chain**: Core governance data (spaces, proposals, votes) stored in smart contracts
- **Off-chain**: Metadata (descriptions, logos, images) stored in MongoDB

This separation reduces gas costs and allows for flexible data management without blockchain constraints.

## Architecture

### Storage Layer (`src/lib/spaceDescriptions.js`)

The storage layer provides a simple abstraction for persisting metadata:

```javascript
// Save space metadata
await saveSpaceDescription(spaceId, {
  ensName: 'myspace.agora',
  description: 'Space description...',
  logo: 'data:image/png;base64,...',
  createdBy: '0x123...',
  txHash: '0xabc...'
});

// Retrieve metadata
const metadata = await getSpaceDescription(spaceId);

// Update metadata
await updateSpaceDescription(spaceId, {
  description: 'Updated description',
  logo: 'data:image/svg+xml;base64,...'
});
```

**Implementation**: MongoDB with Mongoose ODM
- Database: MongoDB Atlas (cloud) or local MongoDB instance
- Collection: `spacemetadatas`
- Schema: Defined in `src/lib/models/SpaceMetadata.js`
- Connection: Managed via `src/lib/mongodb.js` with connection pooling
- Automatic timestamps (createdAt, updatedAt) handled by Mongoose

**Configuration**:
Set `MONGODB_URI` in `.env.local`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/agora?retryWrites=true&w=majority
```

### API Layer (`src/app/api/space-description/route.js`)

RESTful API endpoints for metadata operations:

#### POST `/api/space-description`
Create new space metadata.

**Request**:
```json
{
  "spaceId": "myspace",
  "ensName": "myspace.agora",
  "description": "This is my governance space",
  "logo": "data:image/png;base64,...",
  "createdBy": "0x123...",
  "txHash": "0xabc..."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "ensName": "myspace.agora",
    "description": "This is my governance space",
    "logo": "data:image/png;base64,...",
    "createdBy": "0x123...",
    "txHash": "0xabc...",
    "createdAt": "2025-12-23T10:00:00.000Z",
    "updatedAt": "2025-12-23T10:00:00.000Z"
  }
}
```

#### GET `/api/space-description?spaceId=myspace`
Retrieve metadata for a specific space.

#### GET `/api/space-description`
Retrieve all space metadata (admin/debugging).

#### PATCH `/api/space-description`
Update existing metadata.

**Request**:
```json
{
  "spaceId": "myspace",
  "description": "Updated description",
  "logo": ""
}
```

### Client Integration (`src/hooks/useSpaceDescription.js`)

Custom React hook for easy data fetching:

```javascript
import { useSpaceDescription } from '@/hooks/useSpaceDescription';

function SpaceDetails({ spaceName }) {
  const { description, loading, error } = useSpaceDescription(spaceName);
  
  if (loading) return <Loader />;
  if (error) return <Error message={error} />;
  
  return (
    <div>
      <h2>{description?.ensName}</h2>
      <p>{description?.description}</p>
      {description?.logo && <img src={description.logo} alt="Logo" />}
    </div>
  );
}
```

**Features**:
- Automatic caching with React Query
- Loading and error states
- Type-safe returns
- Revalidation on focus

## Data Schema

### Space Metadata Object

```typescript
interface SpaceMetadata {
  spaceId: string;         // Space identifier (e.g., "myspace")
  ensName: string;         // Full ENS name (e.g., "myspace.agora")
  description: string;     // Space description (max 500 chars)
  logo: string;           // Base64 encoded image or empty string
  createdBy: string;      // Creator's Ethereum address
  txHash?: string;        // Transaction hash of space creation
  createdAt: Date;        // Timestamp of creation
  updatedAt: Date;        // Timestamp of last update
}
```

### MongoDB Schema

The data is stored in MongoDB using the following Mongoose schema:

```javascript
const SpaceMetadataSchema = new mongoose.Schema({
  spaceId: {
    type: String,
    required: true,
    unique: true,
    index: true  // Indexed for fast lookups
  },
  ensName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  logo: {
    type: String,
    default: ''
  },
  createdBy: {
    type: String,
    required: true
  },
  txHash: String
}, {
  timestamps: true  // Automatically manages createdAt and updatedAt
});
```

## Features

### Space Descriptions

**Purpose**: Provide context and information about governance spaces without storing large text on-chain.

**Constraints**:
- Maximum length: 500 characters
- Plain text only (no HTML/markdown)
- Optional field

**Use Cases**:
- Explain the space's purpose
- List governance rules
- Provide contact information
- Link to external resources

### Space Logos

**Purpose**: Visual branding for governance spaces.

**Specifications**:
- Supported formats: PNG, JPG, SVG, WebP
- Maximum file size: 2MB (client-side validation)
- Storage format: Base64 data URI
- Display size: 80x80px (header), 64x64px (preview)
- Color filter: Automatically applied brand color (#4D89B0)

**Upload Flow**:
1. User selects image file
2. Client validates size and format
3. FileReader converts to base64
4. Preview shown with color filter
5. Saved to API on form submit
6. Page refresh displays new logo

**Clear/Remove**:
- "Clear Logo" button removes preview
- Saves empty string to database
- Logo disappears from all views

### Access Control

**Creation**:
- Anyone can create space metadata when creating a space
- Automatically saved after blockchain transaction confirms

**Updates**:
- Only space owner can update metadata
- Only space admins can update metadata
- Enforced in UI (button visibility)
- Should be enforced in API with signature verification (future enhancement)

## MongoDB Implementation

### Database Connection

The application uses a connection pooling strategy to efficiently manage MongoDB connections:

**Connection Handler** (`src/lib/mongodb.js`):
```javascript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false
    }).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
```

This connection handler:
- Reuses existing connections across requests
- Prevents connection exhaustion
- Handles connection errors gracefully
- Works seamlessly with Next.js serverless functions

### Data Model

**Mongoose Model** (`src/lib/models/SpaceMetadata.js`):
```javascript
import mongoose from 'mongoose';

const SpaceMetadataSchema = new mongoose.Schema({
  spaceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  ensName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  logo: {
    type: String,
    default: ''
  },
  createdBy: {
    type: String,
    required: true
  },
  txHash: String
}, {
  timestamps: true
});

export default mongoose.models.SpaceMetadata || 
  mongoose.model('SpaceMetadata', SpaceMetadataSchema);
```

### Storage Operations

**Implementation** (`src/lib/spaceDescriptions.js`):
```javascript
import connectDB from './mongodb';
import SpaceMetadata from './models/SpaceMetadata';

export async function saveSpaceDescription(spaceId, data) {
  await connectDB();
  
  const metadata = await SpaceMetadata.create({
    spaceId,
    ...data
  });
  
  return { success: true, data: metadata };
}

export async function getSpaceDescription(spaceId) {
  await connectDB();
  
  const metadata = await SpaceMetadata.findOne({ spaceId }).lean();
  return metadata;
}

export async function updateSpaceDescription(spaceId, updates) {
  await connectDB();
  
  // Explicitly handle logo field to allow empty string (clear logo)
  const updateData = { ...updates };
  if (updates.hasOwnProperty('logo')) {
    updateData.logo = updates.logo || '';
  }
  
  const metadata = await SpaceMetadata.findOneAndUpdate(
    { spaceId },
    { $set: updateData },
    { new: true }
  ).lean();
  
  if (!metadata) {
    return { success: false, error: 'Space not found' };
  }
  
  return { success: true, data: metadata };
}
```

### Configuration

**Environment Setup**:

Add to `.env.local`:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/agora?retryWrites=true&w=majority
```

**Important for Vercel/Production Deployment**:
- Add `MONGODB_URI` to your deployment platform's environment variables
- In MongoDB Atlas, whitelist `0.0.0.0/0` (allow all IPs) under Network Access for serverless deployments

## Security Considerations

- Space descriptions and logos are **public** by default
- UI-level access control restricts updates to space owners/admins
- MongoDB Atlas includes automated backups and point-in-time recovery
- For production: whitelist `0.0.0.0/0` in MongoDB Atlas Network Access to support serverless deployments

## Performance Optimization

- **Caching**: React Query with 5-minute TTL for client-side caching
- **Database**: Indexed queries on `spaceId`, connection pooling, `.lean()` queries for performance
- **Images**: Base64 encoding, 2MB max, supports PNG/JPG/SVG/WebP, displayed at 80x80px

## Troubleshooting

**"Space description not found"**: Verify space exists on blockchain and spaceId matches ENS name

**"Logo not displaying"**: Check file size <2MB and format is PNG/JPG/SVG/WebP

**"Cannot update description"**: Verify connected wallet is space owner/admin

**MongoDB connection errors**: 
- Check `MONGODB_URI` in environment variables
- Verify IP whitelist in MongoDB Atlas (use `0.0.0.0/0` for Vercel)
