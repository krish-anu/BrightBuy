import React, { useEffect, useState } from "react";

/**
 * UserProfile
 *
 * - Fetches user profile from backend (GET /api/user/profile)
 * - Shows a single "Full name" (from backend) and email (from backend)
 * - Editable fields: phone, addressLine1, addressLine2, postalCode, city
 * - Save button sends PATCH /api/user/profile with updated fields
 *
 * NOTE: adjust endpoint paths if your backend uses different routes (e.g. /api/auth/me).
 * The component reads the JWT token from localStorage.token by default. If your app stores
 * the token elsewhere (AuthContext) replace the token retrieval logic accordingly.
 */

type Profile = {
  fullName: string;
  email: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    postalCode?: string;
    city?: string;
  };
};

export default function UserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Editable local form state
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");

  const token =
    // prefer localStorage but you can replace this with your AuthContext hook if available
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  async function fetchProfile() {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/user/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || `Failed to fetch profile: ${resp.status}`);
      }

      const data: Profile = await resp.json();
      setProfile(data);

      // populate editable fields
      setPhone(data.phone || "");
      setLine1(data.address?.line1 || "");
      setLine2(data.address?.line2 || "");
      setPostalCode(data.address?.postalCode || "");
      setCity(data.address?.city || "");
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = {
      phone: phone || null,
      address: {
        line1: line1 || null,
        line2: line2 || null,
        postalCode: postalCode || null,
        city: city || null,
      },
    };

    try {
      const resp = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || `Failed to update profile: ${resp.status}`);
      }

      const updated: Profile = await resp.json();
      setProfile(updated);
      setSuccess("Profile updated successfully");
      // reflect saved values (in case backend normalizes)
      setPhone(updated.phone || "");
      setLine1(updated.address?.line1 || "");
      setLine2(updated.address?.line2 || "");
      setPostalCode(updated.address?.postalCode || "");
      setCity(updated.address?.city || "");
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
      // clear success after a short time
      setTimeout(() => setSuccess(null), 3500);
    }
  }

  if (loading) return <div>Loading profile...</div>;
  if (error && !profile) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">My Profile</h2>

      {error && <div className="text-red-600 mb-3">{error}</div>}
      {success && <div className="text-green-600 mb-3">{success}</div>}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Full name (from backend) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Full name</label>
          <input
            type="text"
            value={profile?.fullName || ""}
            disabled
            className="mt-1 block w-full border rounded p-2 bg-gray-100"
          />
          <div className="text-xs text-gray-500 mt-1">Name comes from backend / database.</div>
        </div>

        {/* Email (from backend) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={profile?.email || ""}
            disabled
            className="mt-1 block w-full border rounded p-2 bg-gray-100"
          />
        </div>

        {/* Phone (editable) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0771234567"
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        {/* Address fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Address - Line 1</label>
          <input
            type="text"
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            placeholder="Address line 1"
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Address - Line 2</label>
          <input
            type="text"
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
            placeholder="Apartment, suite, unit, building, floor, etc."
            className="mt-1 block w-full border rounded p-2"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Postal code</label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="Postal code"
              className="mt-1 block w-full border rounded p-2"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="mt-1 block w-full border rounded p-2"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>

          <button
            type="button"
            onClick={() => {
              // reset local form state to last loaded profile
              setPhone(profile?.phone || "");
              setLine1(profile?.address?.line1 || "");
              setLine2(profile?.address?.line2 || "");
              setPostalCode(profile?.address?.postalCode || "");
              setCity(profile?.address?.city || "");
              setError(null);
            }}
            className="px-3 py-2 border rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
