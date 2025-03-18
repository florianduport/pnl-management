import { NextResponse } from "next/server"
import { JSONFile } from "lowdb/node"
import { Low } from "lowdb"
import { DbData } from "@/lib/db"
import fs from "fs"
import path from "path"

const dataDir = path.join(process.cwd(), "data")
const dbFile = path.join(process.cwd(), "db.json")

export async function POST(request: Request) {
    try {
        const { version } = await request.json()

        if (!version) {
            return NextResponse.json({ error: "Version non spécifiée" }, { status: 400 })
        }

        const versionFile = path.join(dataDir, version)

        // Vérifier que le fichier de version existe
        if (!fs.existsSync(versionFile)) {
            return NextResponse.json({ error: "Version non trouvée" }, { status: 404 })
        }

        // Vérifier que le fichier est un JSON valide
        const fileContent = fs.readFileSync(versionFile, 'utf-8')
        try {
            JSON.parse(fileContent)
        } catch (e) {
            return NextResponse.json({ error: "Le fichier de version n'est pas un JSON valide" }, { status: 400 })
        }

        // Si le fichier db.json existe, le renommer avec un numéro incrémental
        if (fs.existsSync(dbFile)) {
            const files = fs.readdirSync(dataDir)
            const dbFiles = files.filter(f => f.startsWith("db") && f.endsWith(".json"))
            const nextNumber = dbFiles.length + 1
            fs.renameSync(dbFile, path.join(dataDir, `db${nextNumber}.json`))
        }

        // Copier le fichier de version vers db.json
        fs.copyFileSync(versionFile, dbFile)

        // Initialiser une nouvelle instance de lowdb avec le fichier restauré
        const adapter = new JSONFile<DbData>(dbFile)
        const db = new Low(adapter)
        await db.read()

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Erreur lors de la restauration:", error)
        return NextResponse.json({ error: "Erreur lors de la restauration" }, { status: 500 })
    }
} 