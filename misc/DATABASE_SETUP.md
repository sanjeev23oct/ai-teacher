# Database Setup Guide

## Prerequisites
- Docker installed
- Docker Compose installed

## Quick Start

### 1. Start PostgreSQL
```bash
docker-compose up -d
```

This will:
- Start PostgreSQL 16 in a Docker container
- Create database: `ai_teacher_db`
- Expose on port: `5432`
- Data persisted in Docker volume: `postgres_data`

### 2. Install Prisma (if not already installed)
```bash
cd server
npm install @prisma/client
npm install -D prisma
```

### 3. Run Database Migrations
```bash
cd server
npx prisma migrate dev --name init
```

This will:
- Create all tables (QuestionPaper, Question, Grading, Answer)
- Generate Prisma Client

### 4. Generate Prisma Client
```bash
npx prisma generate
```

### 5. Verify Setup
```bash
# Check if database is running
docker ps | grep ai-teacher-db

# Open Prisma Studio (database GUI)
npx prisma studio
```

## Database Schema

### Tables

**QuestionPaper**
- Stores extracted question papers
- Deduplicates by image hash
- Tracks usage count

**Question**
- Individual questions from question papers
- Linked to QuestionPaper
- Stores question text, number, topic

**Grading**
- Stores grading results
- Links to QuestionPaper (if dual mode)
- Stores overall feedback and scores

**Answer**
- Individual answers from students
- Linked to Grading
- Stores student answer, correctness, score

## Common Commands

### Start Database
```bash
docker-compose up -d
```

### Stop Database
```bash
docker-compose down
```

### Stop and Remove Data
```bash
docker-compose down -v
```

### View Logs
```bash
docker-compose logs -f postgres
```

### Connect to Database (psql)
```bash
docker exec -it ai-teacher-db psql -U ai_teacher -d ai_teacher_db
```

### Prisma Studio (Database GUI)
```bash
cd server
npx prisma studio
```

### Reset Database
```bash
cd server
npx prisma migrate reset
```

### Create New Migration
```bash
cd server
npx prisma migrate dev --name your_migration_name
```

## Environment Variables

### Development (.env)
```bash
DATABASE_URL="postgresql://ai_teacher:dev_password_change_in_prod@localhost:5432/ai_teacher_db"
```

### Production
Update with your production database credentials:
```bash
DATABASE_URL="postgresql://user:password@host:5432/database"
```

## Troubleshooting

### Port 5432 Already in Use
If you have PostgreSQL already running locally:
```bash
# Option 1: Stop local PostgreSQL
sudo service postgresql stop

# Option 2: Change port in docker-compose.yml
ports:
  - "5433:5432"  # Use 5433 instead

# Then update DATABASE_URL
DATABASE_URL="postgresql://ai_teacher:dev_password_change_in_prod@localhost:5433/ai_teacher_db"
```

### Connection Refused
```bash
# Check if container is running
docker ps

# Check container logs
docker-compose logs postgres

# Restart container
docker-compose restart postgres
```

### Prisma Client Not Found
```bash
cd server
npx prisma generate
```

### Migration Failed
```bash
# Reset and try again
cd server
npx prisma migrate reset
npx prisma migrate dev
```

## Data Backup

### Backup Database
```bash
docker exec ai-teacher-db pg_dump -U ai_teacher ai_teacher_db > backup.sql
```

### Restore Database
```bash
docker exec -i ai-teacher-db psql -U ai_teacher ai_teacher_db < backup.sql
```

## Next Steps

After setup:
1. Start the server: `cd server && npm run dev`
2. Server will connect to PostgreSQL automatically
3. Question papers will be stored and reused
4. Check Prisma Studio to see stored data
