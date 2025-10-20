import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../axiosConfig";
import { getAllCities, type City } from "@/services/city.services";
import {
  listAddresses,
  addAddress as apiAddAddress,
  updateAddress as apiUpdateAddress,
  deleteAddress as apiDeleteAddress,
  makeDefaultAddress,
  type Address,
} from "@/services/address.services";

/**
 * UserProfile
 *
 * - Fetches user profile from backend (GET /api/users/profile)
 * - Shows full name and email (read-only)
 * - Editable: phone only (PATCH /api/users/profile)
 * - Addresses: list, add, edit, delete, make default via /api/users/addresses endpoints
 */

type Profile = {
  fullName: string;
  email: string;
  phone?: string;
  addresses?: Address[];
};

export default function UserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Avatar (frontend-only)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUrlInput, setAvatarUrlInput] = useState("");

  // Editable local form state
  const [phone, setPhone] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [cityId, setCityId] = useState<number | null>(null);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // ✅ FIX: Move all hooks (like useMemo) ABOVE any conditional return
  const cityNameById = useMemo(() => {
    const m = new Map<number, string>();
    cities.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [cities]);

  async function fetchProfile() {
    setLoading(true);
    setError(null);
    try {
      const resp = await axiosInstance.get("/api/users/profile");
      const data: Profile = resp.data;
      setProfile(data);
      setPhone(data.phone || "");
      // addresses
      let addrs = Array.isArray(data.addresses) ? data.addresses : [];
      if (!addrs.length) {
        addrs = await listAddresses();
      }
      setAddresses(addrs);
      const def = addrs.find((a) => a.isDefault === 1) || addrs[0];
      if (def) {
        setEditingId(def.id);
        setLine1(def.line1 || "");
        setLine2(def.line2 || "");
        setPostalCode(def.postalCode || "");
        setCityId(def.cityId ?? null);
      } else {
        setEditingId(null);
        setLine1("");
        setLine2("");
        setPostalCode("");
        setCityId(null);
      }
      const cityList = await getAllCities();
      setCities(cityList);
      try {
        const stored = localStorage.getItem("profile_avatar");
        if (stored) setAvatarUrl(stored);
      } catch {}
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load profile"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Now safe to conditionally render
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <h2 className="text-2xl font-semibold text-primary mb-4">
          My Profile
        </h2>
        <div className="text-gray-600">Loading your profile...</div>
      </div>
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const addrPayload =
      line1 && (cityId !== null && cityId !== undefined)
        ? {
            id: editingId || undefined,
            line1,
            line2: line2 || null,
            postalCode: postalCode || null,
            cityId: Number(cityId),
          }
        : undefined;
    const payload: any = { phone: phone || null };
    if (addrPayload) payload.address = addrPayload;

    try {
      const resp = await axiosInstance.patch("/api/users/profile", payload);
      const updated: Profile = resp.data;
      setProfile(updated);
      setSuccess("Profile updated successfully");
      setPhone(updated.phone || "");
      const addrs = Array.isArray(updated.addresses)
        ? updated.addresses
        : await listAddresses();
      setAddresses(addrs);
      const def = addrs.find((a) => a.isDefault === 1) || addrs[0];
      if (def) await handleSelectForEdit(def);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to save profile"
      );
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(null), 3500);
    }
  }

  async function handleSelectForEdit(addr: Address) {
    setEditingId(addr.id);
    setLine1(addr.line1 || "");
    setLine2(addr.line2 || "");
    setPostalCode(addr.postalCode || "");
    setCityId(addr.cityId ?? null);
  }

  async function handleAddOrUpdateAddress(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (!line1 || cityId === null || cityId === undefined) {
        setError("Address line1 and city are required");
        return;
      }
      if (editingId) {
        await apiUpdateAddress(editingId, { line1, line2, postalCode, cityId });
      } else {
        await apiAddAddress({
          line1,
          line2,
          postalCode,
          cityId,
          isDefault: addresses.length ? 0 : 1,
        });
      }
      const addrs = await listAddresses();
      setAddresses(addrs);
      const def = addrs.find((a) => a.isDefault === 1) || addrs[0];
      if (def) await handleSelectForEdit(def);
      setSuccess(editingId ? "Address updated" : "Address added");
      setEditingId(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to save address"
      );
    }
  }

  async function handleDelete(id: number) {
    setError(null);
    try {
      await apiDeleteAddress(id);
      const addrs = await listAddresses();
      setAddresses(addrs);
      const def = addrs.find((a) => a.isDefault === 1) || addrs[0];
      if (def) await handleSelectForEdit(def);
      setSuccess("Address deleted");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete address"
      );
    }
  }

  async function handleMakeDefault(id: number) {
    setError(null);
    try {
      await makeDefaultAddress(id);
      const addrs = await listAddresses();
      setAddresses(addrs);
      const def = addrs.find((a) => a.isDefault === 1) || addrs[0];
      if (def) await handleSelectForEdit(def);
      setSuccess("Default address updated");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to set default address"
      );
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-semibold text-primary mb-4">My Profile</h2>

      {error && <div className="text-red-600 mb-3">{error}</div>}
      {success && <div className="text-green-600 mb-3">{success}</div>}

      <form onSubmit={handleSave} className="space-y-4">
        <div className="flex items-center mb-6 gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
            <img
              src={
                avatarPreview ||
                avatarUrl ||
                (profile?.email
                  ? `https://www.gravatar.com/avatar/${encodeURIComponent(
                      profile.email
                    )}?d=identicon`
                  : "https://via.placeholder.com/80")
              }
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingAvatar(true);
                  setAvatarUrlInput(avatarUrl || "");
                  setAvatarPreview(null);
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Change
              </button>

              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("profile_avatar");
                  setAvatarUrl(null);
                  setAvatarPreview(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Remove
              </button>
            </div>

            {editingAvatar && (
              <div className="mt-3 p-3 border rounded bg-gray-50">
                <label className="block text-sm font-medium text-gray-700">
                  Image URL
                </label>
                <input
                  type="text"
                  value={avatarUrlInput}
                  onChange={(e) => setAvatarUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 block w-full border rounded p-2"
                />

                <div className="mt-2">OR upload file:</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files && e.target.files[0];
                    if (f) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        setAvatarPreview(reader.result as string);
                      };
                      reader.readAsDataURL(f);
                    }
                  }}
                  className="mt-1"
                />

                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      const toSave = avatarPreview || avatarUrlInput || null;
                      if (toSave) {
                        try {
                          localStorage.setItem("profile_avatar", toSave);
                          setAvatarUrl(toSave);
                        } catch (e) {
                          console.error(
                            "Failed to save avatar to localStorage",
                            e
                          );
                        }
                      }
                      setEditingAvatar(false);
                      setAvatarPreview(null);
                    }}
                    className="px-3 py-2 bg-primary text-white rounded hover:bg-primary/90"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAvatar(false);
                      setAvatarPreview(null);
                      setAvatarUrlInput("");
                    }}
                    className="px-3 py-2 border rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Full name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Full name
          </label>
          <input
            type="text"
            value={profile?.fullName || ""}
            disabled
            className="mt-1 block w-full border rounded p-2 bg-gray-100"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={profile?.email || ""}
            disabled
            className="mt-1 block w-full border rounded p-2 bg-gray-100"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Phone number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0771234567"
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        {/* Addresses */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-primary mb-2">Addresses</h3>
          <div className="space-y-2">
            {addresses.map((a) => (
              <div
                key={a.id}
                className={`flex items-center justify-between border rounded p-3 ${
                  a.isDefault ? "bg-green-50" : "bg-white"
                }`}
              >
                <div className="text-sm">
                  <div className="font-medium">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ""}
                  </div>
                  <div className="text-gray-600">
                    {a.postalCode || ""}{" "}
                    {a.cityId ? cityNameById.get(a.cityId) || "" : ""}
                  </div>
                  {a.isDefault ? (
                    <span className="text-green-700 font-medium">Default</span>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  {!a.isDefault && (
                    <button
                      type="button"
                      className="px-3 py-1 border rounded"
                      onClick={() => handleMakeDefault(a.id)}
                    >
                      Make default
                    </button>
                  )}
                  <button
                    type="button"
                    className="px-3 py-1 border rounded"
                    onClick={() => handleSelectForEdit(a)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 border rounded text-red-600"
                    onClick={() => handleDelete(a.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {addresses.length === 0 && (
              <div className="text-sm text-gray-600">
                No addresses yet. Add one below.
              </div>
            )}
          </div>
        </div>

        {/* Change password section */}
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h3 className="text-lg font-semibold text-primary mb-2">
            Change password
          </h3>

          {passwordError && (
            <div className="text-red-600 mb-2">{passwordError}</div>
          )}
          {passwordSuccess && (
            <div className="text-green-600 mb-2">{passwordSuccess}</div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Current password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 block w-full border rounded p-2"
                placeholder="Your current password"
                autoComplete="current-password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                New password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full border rounded p-2"
                  placeholder="New password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((s) => !s)}
                  className="absolute right-2 top-2 text-sm text-gray-600"
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full border rounded p-2"
                placeholder="Repeat new password"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={async () => {
                setPasswordError(null);
                setPasswordSuccess(null);
                if (!currentPassword || !newPassword || !confirmPassword) {
                  setPasswordError("All password fields are required");
                  return;
                }
                if (newPassword !== confirmPassword) {
                  setPasswordError("New password and confirmation do not match");
                  return;
                }
                if (newPassword.length < 6) {
                  setPasswordError("Password must be at least 6 characters");
                  return;
                }

                setChangingPassword(true);
                try {
                  const resp = await axiosInstance.post(
                    "/api/users/change-password",
                    { currentPassword, newPassword }
                  );
                  setPasswordSuccess(
                    resp?.data?.message || "Password changed successfully"
                  );
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setTimeout(() => setPasswordSuccess(null), 3000);
                } catch (err: any) {
                  setPasswordError(
                    err?.response?.data?.message || err?.message || "Failed to change password"
                  );
                } finally {
                  setChangingPassword(false);
                }
              }}
              disabled={changingPassword}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-60"
            >
              {changingPassword ? "Changing..." : "Change password"}
            </button>

            <button
              type="button"
              className="px-3 py-2 border rounded"
              onClick={() => {
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setPasswordError(null);
                setPasswordSuccess(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Address editor */}
        <div className="mt-4 p-3 border rounded">
          <h4 className="font-medium mb-2">
            {editingId ? "Edit address" : "Add new address"}
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Address - Line 1
              </label>
              <input
                className="mt-1 block w-full border rounded p-2"
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                placeholder="Address line 1"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Address - Line 2
              </label>
              <input
                className="mt-1 block w-full border rounded p-2"
                value={line2}
                onChange={(e) => setLine2(e.target.value)}
                placeholder="Address line 2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Postal code
              </label>
              <input
                className="mt-1 block w-full border rounded p-2"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="Postal code"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                City
              </label>
              <select
                className="mt-1 block w-full border rounded p-2 bg-white"
                value={cityId ?? ""}
                onChange={(e) =>
                  setCityId(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">Select a city</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              className="px-4 py-2 bg-primary text-white rounded disabled:opacity-60 hover:bg-primary/90"
              onClick={handleAddOrUpdateAddress}
            >
              {editingId ? "Update address" : "Add address"}
            </button>
            {editingId && (
              <button
                type="button"
                className="px-3 py-2 border rounded"
                onClick={() => {
                  setEditingId(null);
                  setLine1("");
                  setLine2("");
                  setPostalCode("");
                  setCityId(null);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
