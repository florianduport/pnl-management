import { NextResponse } from "next/server"
import { JSONFile } from "lowdb/node"
import { Low } from "lowdb"
import { DbData } from "@/lib/db"
import fs from "fs"
import path from "path"

const dataDir = path.join(process.cwd(), "data")
const versionsDir = path.join(dataDir, "versions")
const dbFile = path.join(dataDir, "db.json")

// S'assurer que les dossiers existent
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir)
}
if (!fs.existsSync(versionsDir)) {
    fs.mkdirSync(versionsDir)
}

export async function GET() {
    try {
        // Lire tous les fichiers db*.json dans le dossier versions
        const files = fs.readdirSync(versionsDir)
        const dbFiles = files.filter(file => file.startsWith("db") && file.endsWith(".json"))

        // Pour chaque fichier, récupérer sa date de modification
        const versions = dbFiles.map(file => {
            const stats = fs.statSync(path.join(versionsDir, file))
            return {
                name: file,
                date: stats.mtime,
                size: stats.size
            }
        })

        // Trier par date de modification décroissante
        versions.sort((a, b) => b.date.getTime() - a.date.getTime())

        return NextResponse.json(versions)
    } catch (error) {
        console.error("Erreur lors de la lecture des versions:", error)
        return NextResponse.json({ error: "Erreur lors de la lecture des versions" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ error: "Fichier non spécifié" }, { status: 400 })
        }

        // Vérifier que le fichier est un JSON valide
        const fileBuffer = Buffer.from(await file.arrayBuffer())
        try {
            JSON.parse(fileBuffer.toString())
        } catch (e) {
            return NextResponse.json({ error: "Le fichier n'est pas un JSON valide" }, { status: 400 })
        }

        // Si le fichier db.json existe, le déplacer dans le dossier versions avec un numéro incrémental
        if (fs.existsSync(dbFile)) {
            const files = fs.readdirSync(versionsDir)
            const dbFiles = files.filter(f => f.startsWith("db") && f.endsWith(".json"))
            const nextNumber = dbFiles.length + 1
            fs.renameSync(dbFile, path.join(versionsDir, `db${nextNumber}.json`))
        }

        // Sauvegarder le nouveau fichier comme db.json
        fs.writeFileSync(dbFile, fileBuffer)

        // Initialiser une nouvelle instance de lowdb avec le fichier importé
        const adapter = new JSONFile<DbData>(dbFile)
        const db = new Low(adapter)
        await db.read()

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Erreur lors de l'importation:", error)
        return NextResponse.json({ error: "Erreur lors de l'importation" }, { status: 500 })
    }
} 