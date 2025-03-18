import { useEffect, useState } from "react"
import { History } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface Version {
    name: string
    date: string
    size: number
}

export function VersionsDialog() {
    const [versions, setVersions] = useState<Version[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [versionToRestore, setVersionToRestore] = useState<Version | null>(null)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)

    const loadVersions = async () => {
        try {
            const response = await fetch("/api/db/versions")
            const data = await response.json()
            setVersions(data)
        } catch (error) {
            console.error("Erreur lors du chargement des versions:", error)
        }
    }

    useEffect(() => {
        if (isOpen) {
            loadVersions()
        }
    }, [isOpen])

    const handleRestoreVersion = async (version: Version) => {
        setVersionToRestore(version)
        setIsConfirmOpen(true)
    }

    const confirmRestore = async () => {
        if (!versionToRestore) return

        try {
            const response = await fetch("/api/db/versions/restore", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ version: versionToRestore.name }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Erreur lors de la restauration")
            }

            setIsConfirmOpen(false)
            setVersionToRestore(null)
            // Recharger la page après la restauration
            window.location.reload()
        } catch (error) {
            console.error("Erreur lors de la restauration:", error)
            alert(error instanceof Error ? error.message : "Erreur lors de la restauration")
        }
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start p-2">
                        <History className="mr-2 h-4 w-4" />
                        Versions
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Versions de la base de données</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto">
                        <div className="space-y-2">
                            {versions.map((version) => (
                                <div
                                    key={version.name}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                                    onClick={() => handleRestoreVersion(version)}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium">{version.name}</span>
                                        <span className="text-sm text-muted-foreground">
                                            {new Date(version.date).toLocaleString()}
                                        </span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        {(version.size / 1024).toFixed(2)} KB
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmer la restauration</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p>
                            Êtes-vous sûr de vouloir restaurer la version{" "}
                            <span className="font-medium">{versionToRestore?.name}</span> ?
                            Cette action remplacera la base de données actuelle.
                        </p>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
                            Annuler
                        </Button>
                        <Button onClick={confirmRestore}>Confirmer</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
} 