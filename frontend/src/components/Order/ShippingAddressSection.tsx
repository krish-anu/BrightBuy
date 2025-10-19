import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import type { Address } from "@/types/Address";
import { AddressSummary } from "./AddressSummary";
import { AddressList } from "./AddressList";
import { AddressEditForm } from "./AddressEditForm";
import { getUserProfile } from "@/services/user.services";
import { useNavigate, useLocation } from "react-router-dom";

export default function ShippingAddressSection() {
	const navigate = useNavigate();
	const location = useLocation();
	const [addresses, setAddresses] = useState<Address[]>([]);
	const [selectedId, setSelectedId] = useState<string>("");
	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState<Address | null>(null);
	const [open, setOpen] = useState(false);
	const [profileLoading, setProfileLoading] = useState(false);
	const [profileError, setProfileError] = useState<unknown>(null);

	useEffect(() => {
		let ignore = false;

		const mapToAddress = (raw: any, index: number): Address => ({
			id: String(
				raw?.id ??
					raw?.addressId ??
					raw?.uuid ??
					raw?._id ??
					`addr-${index}`
			),
			name: raw?.fullName ?? raw?.name ?? raw?.contactName ?? "",
			address:
				[raw?.line1, raw?.line2, raw?.street].filter(Boolean).join(", ") ||
				raw?.address ||
				"",
			city: raw?.cityName ?? raw?.city ?? "",
			zip: String(raw?.postalCode ?? raw?.zip ?? ""),
			phone: String(raw?.phone ?? raw?.mobile ?? ""),
			isDefault: Boolean(raw?.isDefault === true || raw?.isDefault === 1),
		});

		const fetchProfile = async () => {
			try {
				if (ignore) return;
				setProfileError(null);
				setProfileLoading(true);
				const res = await getUserProfile();
				if (ignore) return;

				const payload =
					res && typeof res === "object" && "data" in (res as Record<string, unknown>)
						? (res as { data: unknown }).data
						: res;
				
				console.log("Fetched profile payload:", payload);

				const rawAddresses = Array.isArray((payload as any)?.addresses)
					? ((payload as any).addresses as any[])
					: [];

				const mapped = rawAddresses.map(mapToAddress);
				if (ignore) return;
				setAddresses(mapped);
				console.log("Mapped addresses:", mapped);
				if (!mapped.length) {
					setSelectedId("");
					return;
				}

				// Try to retain previously selected address 
				setSelectedId((prev) => {
					if (prev && mapped.some((addr) => addr.id === prev)) return prev;
					const fallback = mapped.find((addr) => addr.isDefault) ?? mapped[0];
					return fallback ? fallback.id : "";
				});
			} catch (error) {
				const status = (error as any)?.response?.status ?? (error as any)?.status;
				console.log("Fetch profile error status:", status, "typeof:", typeof status);
				if (status === 401) {
					// pass current location so login can return the user here
					navigate("/login", { state: { from: location }, replace: true });
					return;
				}
                 if (!ignore) setProfileError(error);
                 console.log("Error while fetching address data: ",error);
             } finally {
                 if (!ignore) setProfileLoading(false);
             }
         };

		fetchProfile();

		return () => {
			ignore = true;
		};
	}, []);

	useEffect(() => {
		if (!addresses.length) {			
			setSelectedId("");
			return;
		}

		if (!selectedId || !addresses.some((addr) => addr.id === selectedId)) {
			const fallback = addresses.find((addr) => addr.isDefault) ?? addresses[0];
			if (fallback) setSelectedId(fallback.id);
		}
	}, [addresses, selectedId]);

	useEffect(() => {
		if (!open) {
			setIsEditing(false);
			setFormData(null);
		}
	}, [open]);

	const handleAddNew = () => {
		setFormData({
			id: `addr-${Date.now()}`,
			name: "",
			address: "",
			city: "",
			zip: "",
			phone: "",
			isDefault: addresses.length === 0,
		});
		setIsEditing(true);
	};

	const handleEditSubmit = (next: Address) => {
		setAddresses((prev) => {
			const exists = prev.some((addr) => addr.id === next.id);
			if (!exists) {
				if (next.isDefault) {
					const cleared = prev.map((addr) => ({ ...addr, isDefault: false }));
					return [...cleared, { ...next, isDefault: true }];
				}
				return [...prev, { ...next, isDefault: false }];
			}

			if (next.isDefault) {
				return prev.map((addr) =>
					addr.id === next.id
						? { ...next, isDefault: true }
						: { ...addr, isDefault: false }
				);
			}

			return prev.map((addr) => (addr.id === next.id ? { ...next } : addr));
		});

		setSelectedId(next.id);
		setIsEditing(false);
		setFormData(null);
		setOpen(false);
	};

	const defaultId =
		addresses.find((addr) => addr.isDefault)?.id ?? addresses[0]?.id ?? "";

	return (
		<div>
			<span>
				<h2 className="text-xl md:text-2xl font-bold">Shipping Address</h2>
				<p className="text-md md:text-lg text-muted-foreground">
					Please choose your preferred shipping address or add a new one below.
				</p>
			</span>

			<div className="flex flex-col md:flex-row md:items-center rounded-lg mt-4 p-4 bg-muted/20 gap-4">
				<div className="w-full space-y-2">
					{profileLoading && (
						<p className="text-sm text-muted-foreground">Loading your saved addresses…</p>
					)}
					{!profileLoading && !addresses.length && !profileError && (
						<p className="text-sm text-muted-foreground">
							You have not added any addresses yet. Create one to continue.
						</p>
					)}
					{!!profileError && (
						<p className="text-sm text-destructive">
							We could not load your saved addresses. Please try again.
						</p>
					)}
					<AddressSummary
						address={
							addresses.find((addr) => addr.id === selectedId) ??
							addresses.find((addr) => addr.isDefault) ??
							addresses[0]
						}
					/>
				</div>
				<div className="flex md:flex-col justify-end">
					<Dialog open={open} onOpenChange={setOpen}>
						<DialogTrigger asChild>
							<Button
								variant="order_outline"
								size="sm"
								disabled={profileLoading}
								className="md:px-6 px-4 md:text-lg text-md text-primary border-primary hover:text-background disabled:cursor-not-allowed"
							>
								Change
							</Button>
						</DialogTrigger>
						<DialogContent className="md:w-full">
							<DialogTitle>
								{isEditing ? "Edit Address" : "Change Shipping Address"}
							</DialogTitle>
							<DialogDescription>
								{isEditing
									? "Update the fields and save your changes"
									: "Select or edit your shipping address"}
							</DialogDescription>
							<section>
								{!isEditing ? (
									<>
										{addresses.length ? (
											<AddressList
												addresses={addresses}
												value={selectedId || defaultId}
												onChange={(val) => setSelectedId(val)}
												onEdit={(addr) => {
												setFormData(addr);
												setIsEditing(true);
											}}
											/>
										) : (
											<p className="text-sm text-muted-foreground mt-4">
												No saved addresses yet. Add one below.
											</p>
										)}
										<div>
											<Button
												variant="order_outline"
												className="mt-4 text-primary border-primary hover:text-background w-full"
												onClick={handleAddNew}
											>
												+ Add New Address
											</Button>
										</div>
									</>
								) : (
									formData && (
										<AddressEditForm
											value={formData}
											isLastDefault={
												addresses.filter((addr) => addr.isDefault).length === 1 &&
												!!formData.isDefault
											}
											onChange={(next) => setFormData(next)}
											onCancel={() => {
												setIsEditing(false);
												setFormData(null);
												if (!addresses.length) setOpen(false);
											}}
											onSubmit={() => {
												if (!formData) return;
												handleEditSubmit(formData);
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
	);
}
