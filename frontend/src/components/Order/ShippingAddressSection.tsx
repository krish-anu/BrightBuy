import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Address } from "@/types/Address";
import { AddressSummary } from "./AddressSummary";
import { AddressList } from "./AddressList";
import { AddressEditForm } from "./AddressEditForm";

export default function ShippingAddressSection() {
    const [addresses, setAddresses] = useState<Address[]>([
        { id: "a1", name: "Kajatheepan", address: "address", city: "city", zip: "40000", phone: "0785665236", isDefault: true },
        { id: "a2", name: "John Doe", address: "address", city: "city", zip: "40000", phone: "0785665236" },
        { id: "a3", name: "Jane Smith", address: "address", city: "city", zip: "40000", phone: "0785665236" },
    ]);

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Address | null>(null);
    const [open, setOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string>(() =>
        addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? ""
    );
    const [initialSelectedId, setInitialSelectedId] = useState<string>("");

    // Capture the selection when opening the dialog so we know if the user actually changed it
    useEffect(() => {
        if (open) {
            setInitialSelectedId(selectedId);
            setIsEditing(false); // ensure we start in list view each time dialog opens
        }
    }, [open]);

    // Edit starts by setting formData and toggling isEditing in AddressList onEdit handler

    const defaultId = addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "";

    return (
        <div>
            <h2 className="text-xl md:text-2xl font-bold">Shipping Address</h2>
            <div className="flex flex-row rounded-lg mt-4 p-4 bg-muted/20">
                <div className="w-full">
                    <AddressSummary address={addresses.find((a) => a.id === selectedId) ?? addresses.find((a) => a.isDefault) ?? addresses[0]} />
                </div>
                <div className="flex flex-col items-center ">
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button variant="order_outline" size="sm" className=" md:px-6 px-4 md:text-lg text-md text-primary border-primary hover:text-background">Change</Button>
                        </DialogTrigger>
                        <DialogContent className="md:w-full">
                            <DialogTitle>{isEditing ? "Edit Address" : "Change Shipping Address"}</DialogTitle>
                            <DialogDescription>
                                {isEditing ? "Update the fields and save your changes" : "Select or edit your shipping address"}
                            </DialogDescription>
                            <section>
                                {!isEditing ? (
                                    <>
                                        <AddressList
                                            addresses={addresses}
                                            value={selectedId || defaultId}
                                            onChange={(val) => setSelectedId(val)}
                                            onEdit={(addr) => {
                                                setFormData(addr)
                                                setIsEditing(true)
                                            }}
                                        />
                                        <div>
                                            <Button
                                                variant="order_outline"
                                                className="mt-4 text-primary border-primary hover:text-background w-full"
                                                onClick={() => {
                                                    setFormData({ id: `a${Date.now()}`, name: "", address: "", city: "", zip: "", phone: "", isDefault: addresses.length === 0 })
                                                    setIsEditing(true)
                                                }}
                                            >
                                                + Add New Address
                                            </Button>
                                        </div>
                                        <div className="flex justify-end gap-2 pt-4">
                                            <Button
                                                variant="order_outline"
                                                onClick={() => {
                                                    setSelectedId(initialSelectedId)
                                                    setOpen(false)
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                variant="order"
                                                className="bg-primary"
                                                onClick={() => {
                                                    if ((selectedId || defaultId) !== initialSelectedId) {
                                                        setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === (selectedId || defaultId) })))
                                                    }
                                                    setOpen(false)
                                                }}
                                            >
                                                Save
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    formData && (
                                        <AddressEditForm
                                            value={formData}
                                            isLastDefault={addresses.filter((a) => a.isDefault).length === 1 && !!formData.isDefault}
                                            onChange={(next) => setFormData(next)}
                                            onCancel={() => setIsEditing(false)}
                                            onSubmit={() => {
                                                setAddresses((prev) => {
                                                    const exists = prev.some((a) => a.id === formData.id)
                                                    if (!exists) {
                                                        if (formData.isDefault) {
                                                            const cleared = prev.map((a) => ({ ...a, isDefault: false }))
                                                            return [...cleared, { ...formData, isDefault: true }]
                                                        }
                                                        return [...prev, { ...formData, isDefault: false }]
                                                    }
                                                    if (formData.isDefault) {
                                                        return prev.map((a) => (a.id === formData.id ? { ...formData, isDefault: true } : { ...a, isDefault: false }))
                                                    }
                                                    return prev.map((a) => (a.id === formData.id ? { ...formData } : a))
                                                })
                                                setSelectedId(formData.id)
                                                setIsEditing(false)
                                            }}
                                        />
                                    )
                                )}
                            </section>
                        </DialogContent>
                    </Dialog>
                </div>

            </div>
        </div>
    )
}