import { NextResponse } from "next/server"
import { JSONFile } from "lowdb/node"
import { Low } from "lowdb"
import { DbData } from "@/lib/db"
import path from "path"
import fs from "fs"

const dataDir = path.join(process.cwd(), "data")
const dbFile = path.join(dataDir, "db.json")

// S'assurer que le dossier data existe
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir)
}

const adapter = new JSONFile<DbData>(dbFile)
const db = new Low(adapter)
db.data = {
    scenarios: [],
    scenarioData: {},
}

export async function GET() {
    await db.read()
    return NextResponse.json(db.data)
}

export async function POST(request: Request) {
    const data = await request.json()
    db.data = data
    await db.write()
    return NextResponse.json({ success: true })
} 