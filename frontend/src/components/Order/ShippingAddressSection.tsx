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
import { addAddress as apiAddAddress, updateAddress as apiUpdateAddress, makeDefaultAddress as apiMakeDefault } from "@/services/address.services";
import { getAllCities, type City } from "@/services/city.services";
import { useNavigate, useLocation } from "react-router-dom";

export default function ShippingAddressSection({
	onSelectionChange,
}: {
	onSelectionChange?: (addressId: string | undefined, address?: Address) => void;
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedId, setSelectedId] = useState<string>("");
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Address | null>(null);
    const [open, setOpen] = useState(false);
	const [cities, setCities] = useState<City[]>([]);
		const [profileLoading, setProfileLoading] = useState(false);
		const [profileError, setProfileError] = useState<unknown>(null);
		const [profileSaving, setProfileSaving] = useState(false);
		const [profileSaveError, setProfileSaveError] = useState<unknown>(null);

		const refetchAddresses = async () => {
			try {
				const res = await getUserProfile();
				const payload =
					res && typeof res === "object" && "data" in (res as Record<string, unknown>)
						? (res as { data: unknown }).data
						: res;
				const rawAddresses = Array.isArray((payload as any)?.addresses)
					? ((payload as any).addresses as any[])
					: [];
				const mapped = rawAddresses.map((raw: any, idx: number): Address => ({
					id: String(raw?.id ?? `addr-${idx}`),
					name: raw?.fullName ?? raw?.name ?? "",
					address: [raw?.line1, raw?.line2].filter(Boolean).join(", ") || raw?.address || "",
					city: raw?.city ?? raw?.cityName ?? "",
					cityId: raw?.cityId ?? undefined,
					zip: String(raw?.postalCode ?? ""),
					phone: String(raw?.phone ?? ""),
					isDefault: Boolean(raw?.isDefault === true || raw?.isDefault === 1),
				}));
				setAddresses(mapped);
				if (mapped.length) {
					const fallback = mapped.find((a) => a.isDefault) ?? mapped[0];
					setSelectedId((prev) => (prev && mapped.some((m) => m.id === prev) ? prev : fallback.id));
				} else {
					setSelectedId("");
				}
			} catch (e) {
				// bubble to caller normally
				throw e;
			}
		};

	useEffect(() => {
		let ignore = false;

		const mapToAddress = (raw: any, index: number): Address => ({
            id: String(raw?.id ?? `addr-${index}`),
            name: raw?.fullName ?? raw?.name ?? "",
            address: [raw?.line1, raw?.line2].filter(Boolean).join(", ") || raw?.address || "",
            city: raw?.city ?? raw?.cityName ?? "",
            cityId: raw?.cityId ?? null,
            zip: String(raw?.postalCode ?? ""),
            phone: String(raw?.phone ?? ""),
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
								// load cities once to power the city selector
								try {
									const allCities = await getAllCities();
									setCities(allCities);
								} catch (e) {
									console.warn("Failed to load cities", e);
								}
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

	// bubble selection changes up
	useEffect(() => {
		if (onSelectionChange) {
			const selected = addresses.find((a) => a.id === selectedId);
			onSelectionChange(selectedId || undefined, selected);
		}
	}, [selectedId, addresses, onSelectionChange]);

	useEffect(() => {
		if (!open) {
			setIsEditing(false);
			setFormData(null);
		}
	}, [open]);

	const handleAddNew = () => {
		(async () => {
			// If we already have addresses, prefill from the first/default address
			const prefillFrom = addresses.find((a) => a.isDefault) ?? addresses[0];
			if (prefillFrom) {
				setFormData({
					id: `addr-${Date.now()}`,
					name: prefillFrom.name || "",
					address: prefillFrom.address || "",
					city: prefillFrom.city || "",
					zip: prefillFrom.zip || "",
					phone: prefillFrom.phone || "",
					isDefault: addresses.length === 0,
				});
				setIsEditing(true);
				return;
			}

			// Otherwise attempt to fetch profile details to prefill
			try {
				setProfileLoading(true);
				const res = await getUserProfile();
				const payload =
					res && typeof res === "object" && "data" in (res as Record<string, unknown>)
						? (res as { data: unknown }).data
						: res;
				const name = (payload as any)?.fullName ?? (payload as any)?.name ?? "";
				const phone = String((payload as any)?.phone ?? "");
				// Try to pull a primary address object if available
				const rawAddr = Array.isArray((payload as any)?.addresses) ? ((payload as any).addresses as any[])[0] : (payload as any)?.address ?? null;
				let addrStr = "";
				let city = "";
				let zip = "";
				if (rawAddr) {
					addrStr = [rawAddr?.line1, rawAddr?.line2].filter(Boolean).join(", ") || rawAddr?.address || "";
					city = rawAddr?.city ?? rawAddr?.cityName ?? "";
					zip = String(rawAddr?.postalCode ?? "");
				}

				setFormData({
					id: `addr-${Date.now()}`,
					name: name,
					address: addrStr,
					city: city,
					zip: zip,
					phone: phone,
					isDefault: addresses.length === 0,
				});
				setIsEditing(true);
			} catch (e) {
				// fallback to empty form
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
			} finally {
				setProfileLoading(false);
			}
		})();
	};

	const handleEditSubmit = async (next: Address) => {
		// resolve cityId before any optimistic updates
		let resolvedCityId = next.cityId ?? null;
		if ((resolvedCityId === null || resolvedCityId === undefined) && next.city) {
			try {
				const cities = await getAllCities();
				const match = cities.find((c) => String(c.name).toLowerCase() === String(next.city).toLowerCase());
				if (match) resolvedCityId = match.id;
			} catch (e) {
				console.warn("Unable to resolve cityId from city name", e);
			}
		}
		if (resolvedCityId === null || resolvedCityId === undefined) {
			setProfileSaveError(new Error("City is required"));
			return;
		}
		// build new addresses list deterministically so we can persist it
		const exists = addresses.some((addr) => addr.id === next.id);
		let newAddresses: Address[] = [];
		if (!exists) {
			if (next.isDefault) {
				newAddresses = addresses.map((addr) => ({ ...addr, isDefault: false }));
				newAddresses = [...newAddresses, { ...next, isDefault: true }];
			} else {
				newAddresses = [...addresses, { ...next, isDefault: false }];
			}
		} else {
			if (next.isDefault) {
				newAddresses = addresses.map((addr) =>
					addr.id === next.id ? { ...next, isDefault: true } : { ...addr, isDefault: false }
				);
			} else {
				newAddresses = addresses.map((addr) => (addr.id === next.id ? { ...next } : addr));
			}
		}

		// optimistic update
		setAddresses(newAddresses);
		setSelectedId(next.id);
		setIsEditing(false);
		setFormData(null);
		setOpen(false);
		// persist via dedicated endpoints
		try {
			setProfileSaving(true);
			setProfileSaveError(null);
			// If next.id is numeric from backend, update; else add
			const numericId = Number(next.id);
			// Parse address into line1, line2, city and postal code when possible.
			const parseAddress = (addressStr: string, cityStr?: string, zipStr?: string) => {
				const result: { line1: string; line2: string | null; city?: string; postalCode?: string | null } = {
					line1: addressStr || "",
					line2: null,
					city: cityStr || undefined,
					postalCode: zipStr || null,
				};
				if (!addressStr) return result;
				// Split on commas — first part is line1, rest join into line2
				const parts = addressStr.split(",").map((p) => p.trim()).filter(Boolean);
				if (parts.length) {
					result.line1 = parts[0];
					if (parts.length > 1) result.line2 = parts.slice(1).join(", ");
				}
				// If city string contains postal code at the end, try to separate it
				if (result.city) {
					const match = String(result.city).match(/^(.*?)[,\s]+(\d{3,10})$/);
					if (match) {
						result.city = match[1].trim();
						result.postalCode = match[2];
					}
				}
				return result;
			};

			const parsed = parseAddress(next.address || "", next.city, next.zip || undefined);

			const payload = {
				line1: parsed.line1 || next.address,
				line2: parsed.line2 || null,
				cityId: resolvedCityId,
				postalCode: (parsed.postalCode ?? next.zip) || null,
				isDefault: !!next.isDefault,
			};
			if (Number.isFinite(numericId) && String(numericId) === next.id) {
				await apiUpdateAddress(numericId, payload as any);
				if (next.isDefault) {
					await apiMakeDefault(numericId);
				}
			} else {
				const resp = await apiAddAddress(payload as any);
				const createdId = resp?.id;
				if (createdId && next.isDefault) {
					await apiMakeDefault(Number(createdId));
				}
			}
			// refetch to align with backend truth
			await refetchAddresses();
		} catch (err) {
			console.error("Failed to persist address change", err);
			setProfileSaveError(err);
		} finally {
			setProfileSaving(false);
		}
	};
    // Note: default address persistence is handled via the edit form toggle or a separate confirm button (if enabled)

	const defaultId =
		addresses.find((addr) => addr.isDefault)?.id ?? addresses[0]?.id ?? "";

	return (
		<div>
			<span>
				<h2 className="text-xl md:text-2xl font-bold">Delivery Details</h2>
				<p className="text-md md:text-lg text-muted-foreground">
					Please choose your preferred delivery address or add a new one below.
				</p>
			</span>

			<div className="flex flex-col md:flex-row md:items-center rounded-lg mt-4 p-4 bg-muted/20 gap-4">
				<div className="w-full space-y-2">
					{profileLoading && (
						<p className="text-sm text-muted-foreground">Loading your saved addresses…</p>
					)}
					{profileSaving && (
						<p className="text-sm text-muted-foreground">Saving address changes…</p>
					)}
					{!!profileSaveError && (
						<p className="text-sm text-destructive">We couldn't save your address changes. Please try again.</p>
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
								{isEditing ? "Edit Address" : "Change Delivery Details"}
							</DialogTitle>
							<DialogDescription>
								{isEditing
									? "Update the fields and save your changes"
									: "Select or edit your delivery details"}
							</DialogDescription>
							<section>
								{!isEditing ? (
									<>
										{addresses.length ? (
											<AddressList
												addresses={addresses}
												value={selectedId || defaultId}
												onChange={(val) => {
													if (val !== selectedId) {
														console.debug("Address selection changed", { from: selectedId, to: val });
														setSelectedId(val);
													}
												}}
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
										<div className="space-y-2">
												<Button
													variant="order_outline"
													className="mt-4 text-primary border-primary hover:text-background w-full"
													onClick={handleAddNew}
												>
													Check your details
												</Button>
											{/* <Button
												variant="order"
												className="w-full"
												disabled={!selectedId || selectedId === (addresses.find((a) => a.isDefault)?.id ?? "")}
												onClick={async () => {
													const currentDefault = addresses.find((a) => a.isDefault)?.id ?? "";
													if (selectedId && selectedId !== currentDefault) {
														console.debug("Confirming selection; persisting default", { selectedId, currentDefault });
														await setDefaultAddress(selectedId);
													}
													setOpen(false);
												}}
											>
												Use Selected Address
											</Button> */}
										</div>
									</>
								) : (
									formData && (
										<AddressEditForm
											value={formData}
											cities={cities}
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
