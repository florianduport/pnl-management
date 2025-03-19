import { NextResponse } from "next/server"
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

export async function POST() {
    try {
        // Vérifier que le fichier db.json existe
        if (!fs.existsSync(dbFile)) {
            return NextResponse.json({ error: "Base de données non trouvée" }, { status: 404 })
        }

        // Lire tous les fichiers db*.json dans le dossier versions
        const files = fs.readdirSync(versionsDir)
        const dbFiles = files.filter(f => f.startsWith("db") && f.endsWith(".json"))
        const nextNumber = dbFiles.length + 1

        // Copier le fichier db.json dans le dossier versions
        fs.copyFileSync(dbFile, path.join(versionsDir, `db${nextNumber}.json`))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Erreur lors de la création de la version:", error)
        return NextResponse.json({ error: "Erreur lors de la création de la version" }, { status: 500 })
    }
} 