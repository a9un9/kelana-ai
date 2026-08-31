"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getProfile, updateProfile } from "@/services/authService";
import { listTrips } from "@/services/tripService";
import { isAuthenticated } from "@/lib/auth";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at?: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tripCount, setTripCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    Promise.all([
      getProfile().catch((err) => {
        throw new Error(err.message || "Failed to load profile");
      }),
      listTrips().catch(() => []),
    ])
      .then(([userData, tripsData]) => {
        setProfile(userData);
        setEditName(userData.name);
        setEditEmail(userData.email);
        setTripCount(Array.isArray(tripsData) ? tripsData.length : 0);
      })
      .catch((err) => {
        setError(err.message || "Could not retrieve profile information.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const handleStartEdit = () => {
    if (profile) {
      setEditName(profile.name);
      setEditEmail(profile.email);
      setEditPassword("");
    }
    setError("");
    setSuccessMessage("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (profile) {
      setEditName(profile.name);
      setEditEmail(profile.email);
      setEditPassword("");
    }
    setError("");
    setIsEditing(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setSaving(true);

    try {
      const payload: { name: string; email: string; password?: string } = {
        name: editName.trim(),
        email: editEmail.trim(),
      };
      if (editPassword && editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      const res = await updateProfile(payload);
      if (res && res.user) {
        setProfile(res.user);
        setEditName(res.user.name);
        setEditEmail(res.user.email);
        setEditPassword("");
        setSuccessMessage("Profile updated successfully!");
        setIsEditing(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-blue-200 selection:text-blue-900 relative items-center justify-center pt-28 pb-16 px-4">
      {/* Fullscreen Background */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop"
        alt="Beautiful Tropical Beach"
        className="fixed inset-0 w-full h-full object-cover -z-20 blur-md scale-105"
      />
      <div className="fixed inset-0 bg-slate-900/60 -z-10"></div>

      <div className="w-full max-w-lg bg-white/95 backdrop-blur-2xl border border-white/60 rounded-lg p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <svg
              className="animate-spin h-10 w-10 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <p className="text-slate-500 font-semibold text-sm">Loading profile...</p>
          </div>
        ) : error && !profile ? (
          <div className="text-center py-8">
            <div className="mb-4 rounded-lg bg-red-50 border border-red-100 text-red-600 px-4 py-3 text-sm font-semibold">
              {error}
            </div>
            <Link
              href="/login"
              className="inline-block mt-2 text-sm font-bold text-blue-600 hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        ) : profile ? (
          <div>
            {/* Header Avatar & Identity */}
            <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100">
              <div className="w-20 h-20 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-500/25 mb-4">
                {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {profile.name}
              </h2>
              <p className="text-sm font-medium text-slate-500 mt-0.5">{profile.email}</p>
              <span className="mt-3 inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                Kelana Explorer
              </span>
            </div>

            {/* Notification Messages */}
            {successMessage && (
              <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 text-sm font-bold flex items-center justify-between">
                <span>{successMessage}</span>
                <button
                  onClick={() => setSuccessMessage("")}
                  className="text-emerald-500 hover:text-emerald-800 text-xs font-bold ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-100 text-red-600 px-4 py-3 text-sm font-semibold">
                {error}
              </div>
            )}

            {/* Edit Mode Form vs View Mode Details */}
            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="py-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Enter your email address"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                    New Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Leave blank to keep current password"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="cursor-pointer flex-1 py-3 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm text-center transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="cursor-pointer flex-1 py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm text-center shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="py-6 space-y-3">
                  <div className="bg-slate-50/80 rounded-lg p-4 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</p>
                        <p className="text-sm font-extrabold text-slate-800">{profile.name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50/80 rounded-lg p-4 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                        <p className="text-sm font-extrabold text-slate-800">{profile.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50/80 rounded-lg p-4 border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[11px] font-bold uppercase tracking-wider">Member Since</span>
                      </div>
                      <p className="text-sm font-extrabold text-slate-800">
                        {profile.created_at
                          ? new Date(profile.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </p>
                    </div>

                    <div className="bg-slate-50/80 rounded-lg p-4 border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-[11px] font-bold uppercase tracking-wider">Last Updated</span>
                      </div>
                      <p className="text-sm font-extrabold text-slate-800">
                        {profile.updated_at
                          ? new Date(profile.updated_at).toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50/80 rounded-lg p-4 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Trips Planned</span>
                    </div>
                    <p className="text-sm font-extrabold text-blue-600">
                      {tripCount !== null ? tripCount : "-"} Trips
                    </p>
                  </div>
                </div>

                {/* Actions: Edit Profile & View Trips */}
                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={handleStartEdit}
                    className="cursor-pointer w-full py-3.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm text-center shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit Profile</span>
                  </button>

                  <Link
                    href="/trips"
                    className="w-full py-3.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-extrabold text-sm text-center transition-colors flex items-center justify-center gap-2"
                  >
                    <span>View My Trips</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
