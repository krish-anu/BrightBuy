import React, { useEffect, useState } from "react";
import axiosInstance from "../../axiosConfig"; // Import your configured axios instance

/**
 * UserProfile
 *
 * - Fetches user profile from backend (GET /api/user/profile)
 * - Shows a single "Full name" (from backend) and email (from backend)
 * - Editable fields: phone, addressLine1, addressLine2, postalCode, city
 * - Save button sends PATCH /api/user/profile with updated fields
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

  // Avatar (frontend-only) - persisted to localStorage
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUrlInput, setAvatarUrlInput] = useState("");

  // Editable local form state
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  async function fetchProfile() {
    setLoading(true);
    setError(null);
    try {
      const resp = await axiosInstance.get("/api/users/profile");

      const data: Profile = resp.data;
      setProfile(data);

      // try load avatar from localStorage (frontend-only) after profile loads
      try {
        const stored = localStorage.getItem('profile_avatar');
        if (stored) setAvatarUrl(stored);
      } catch (e) {
        // ignore
      }

      // populate editable fields
      setPhone(data.phone || "");
      setLine1(data.address?.line1 || "");
      setLine2(data.address?.line2 || "");
      setPostalCode(data.address?.postalCode || "");
      setCity(data.address?.city || "");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load profile");
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
      const resp = await axiosInstance.patch("/api/users/profile", payload);

      const updated: Profile = resp.data;
      setProfile(updated);
      setSuccess("Profile updated successfully");
      // reflect saved values (in case backend normalizes)
      setPhone(updated.phone || "");
      setLine1(updated.address?.line1 || "");
      setLine2(updated.address?.line2 || "");
      setPostalCode(updated.address?.postalCode || "");
      setCity(updated.address?.city || "");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to save profile");
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
      <h2 className="text-2xl font-semibold text-primary mb-4">My Profile</h2>

      {error && <div className="text-red-600 mb-3">{error}</div>}
      {success && <div className="text-green-600 mb-3">{success}</div>}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Avatar display and Change button (frontend-only) */}
        <div className="flex items-center mb-6 gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
            <img
              src={
                avatarPreview ||
                avatarUrl ||
                (profile?.email
                  ? `https://www.gravatar.com/avatar/${encodeURIComponent(profile.email)}?d=identicon`
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
                <label className="block text-sm font-medium text-gray-700">Image URL</label>
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
                          console.error("Failed to save avatar to localStorage", e);
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
        {/* Full name (from backend) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Full name</label>
          <input
            type="text"
            value={profile?.fullName || ""}
            disabled
            className="mt-1 block w-full border rounded p-2 bg-gray-100"
          />
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
            placeholder="Address line 2"
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
            className="px-4 py-2 bg-primary text-white rounded disabled:opacity-60 hover:bg-primary/90"
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

      {/* Change Password Section */}
      <div className="mt-8 bg-white border rounded p-4">
        <h3 className="text-lg font-semibold text-primary mb-4">Change Password</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              className="mt-1 block w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="mt-1 block w-full border rounded p-2 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2 top-2 text-gray-500"
              >
                {showNewPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="mt-1 block w-full border rounded p-2"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={async () => {
                // Basic client-side validation
                setError(null);
                setSuccess(null);
                if (!currentPassword) return setError('Please enter your current password');
                if (!newPassword) return setError('Please enter a new password');
                if (newPassword !== confirmPassword) return setError('New passwords do not match');

                setChangingPassword(true);
                try {
                  const resp = await axiosInstance.post('/api/users/change-password', {
                    currentPassword,
                    newPassword,
                  });
                  setSuccess(resp.data?.message || 'Password changed successfully');
                  // clear fields
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                } catch (err: any) {
                  setError(err.response?.data?.message || err.message || 'Failed to change password');
                } finally {
                  setChangingPassword(false);
                  setTimeout(() => setSuccess(null), 3500);
                }
              }}
              className="px-4 py-2 bg-primary text-white rounded disabled:opacity-60 hover:bg-primary/90"
              disabled={changingPassword}
            >
              {changingPassword ? 'Changing...' : 'Change Password'}
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setError(null);
              }}
              className="px-3 py-2 border rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
