import React, { useEffect, useState } from "react";
import axiosInstance from "../../axiosConfig";

// Admin Profile page uses AdminLayout automatically via routing under /admin/*
// This view keeps the look-and-feel consistent with other admin pages.

interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  postalCode?: string;
}

interface Profile {
  fullName: string;
  email: string;
  phone?: string | null;
  address?: Address;
}

export default function AdminProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const resp = await axiosInstance.get("/api/users/profile");
        const data: Profile = resp.data;
        setProfile(data);
        setPhone(data.phone || "");
        setLine1(data.address?.line1 || "");
        setLine2(data.address?.line2 || "");
        setPostalCode(data.address?.postalCode || "");
        setCity(data.address?.city || "");
      } catch (e: any) {
        setError(
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Failed to load profile"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        phone: phone || null,
        address: {
          line1: line1 || null,
          line2: line2 || null,
          postalCode: postalCode || null,
          city: city || null,
        },
      };
      const resp = await axiosInstance.patch("/api/users/profile", payload);
      const updated: Profile = resp.data;
      setProfile(updated);
      setSuccess("Profile updated successfully");
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to save profile"
      );
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(null), 3500);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">My Profile</h2>
          <p className="text-sm text-muted-foreground">Manage your account information.</p>
        </div>

        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}

        <form onSubmit={handleSave} className="grid gap-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium">Full name</label>
            <input className="mt-1 w-full border rounded p-2 bg-gray-100" disabled value={profile?.fullName || ""} />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input className="mt-1 w-full border rounded p-2 bg-gray-100" disabled value={profile?.email || ""} />
          </div>
          <div>
            <label className="block text-sm font-medium">Phone</label>
            <input className="mt-1 w-full border rounded p-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Address - Line 1</label>
            <input className="mt-1 w-full border rounded p-2" value={line1} onChange={(e) => setLine1(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Address - Line 2</label>
            <input className="mt-1 w-full border rounded p-2" value={line2} onChange={(e) => setLine2(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Postal code</label>
              <input className="mt-1 w-full border rounded p-2" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium">City</label>
              <input className="mt-1 w-full border rounded p-2" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded disabled:opacity-60">{saving ? "Saving..." : "Save changes"}</button>
            <button
              type="button"
              className="px-3 py-2 border rounded"
              onClick={() => {
                setPhone(profile?.phone || "");
                setLine1(profile?.address?.line1 || "");
                setLine2(profile?.address?.line2 || "");
                setPostalCode(profile?.address?.postalCode || "");
                setCity(profile?.address?.city || "");
                setError(null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="border rounded p-4 max-w-2xl bg-white">
          <h3 className="text-lg font-semibold mb-3">Change Password</h3>
          <ChangePassword />
        </div>
      </div>
    </div>
  );
}

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setSuccess(null);
    if (!currentPassword) return setError("Please enter your current password");
    if (!newPassword) return setError("Please enter a new password");
    if (newPassword !== confirmPassword) return setError("New passwords do not match");

    setChanging(true);
    try {
      const resp = await axiosInstance.post('/api/users/change-password', { currentPassword, newPassword });
      setSuccess(resp.data?.message || 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to change password'
      );
    } finally {
      setChanging(false);
      setTimeout(() => setSuccess(null), 3500);
    }
  }

  return (
    <div className="space-y-3">
      {error && <div className="text-red-600">{error}</div>}
      {success && <div className="text-green-600">{success}</div>}
      <div>
        <label className="block text-sm font-medium">Current Password</label>
        <input className="mt-1 w-full border rounded p-2" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium">New Password</label>
        <input className="mt-1 w-full border rounded p-2" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium">Confirm New Password</label>
        <input className="mt-1 w-full border rounded p-2" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
      </div>
      <div className="flex gap-3 pt-2">
        <button className="px-4 py-2 bg-primary text-white rounded disabled:opacity-60" disabled={changing} onClick={submit}>{changing ? 'Changing...' : 'Change Password'}</button>
        <button className="px-3 py-2 border rounded" onClick={() => { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setError(null); }}>Cancel</button>
      </div>
    </div>
  );
}
