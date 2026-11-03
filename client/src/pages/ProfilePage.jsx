import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DisclaimerBanner from '../components/DisclaimerBanner';
import {
  User,
  Heart,
  Shield,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Save,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, donorProfile, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bloodGroup: 'O+',
    gender: 'prefer_not_to_say',
    dateOfBirth: '',
    emergencyContact: { name: '', relation: '', phone: '' },
    address: { street: '', city: '', state: '', pincode: '' },
    consentToStoreData: true,
    consentToContact: true,
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        bloodGroup: donorProfile?.bloodGroup || 'O+',
        gender: donorProfile?.gender || 'prefer_not_to_say',
        dateOfBirth: donorProfile?.dateOfBirth ? donorProfile.dateOfBirth.split('T')[0] : '',
        emergencyContact: {
          name: donorProfile?.emergencyContact?.name || '',
          relation: donorProfile?.emergencyContact?.relation || '',
          phone: donorProfile?.emergencyContact?.phone || '',
        },
        address: {
          street: donorProfile?.address?.street || '',
          city: donorProfile?.address?.city || '',
          state: donorProfile?.address?.state || '',
          pincode: donorProfile?.address?.pincode || '',
        },
        consentToStoreData: donorProfile?.consentToStoreData !== false,
        consentToContact: donorProfile?.consentToContact !== false,
      });
    }
  }, [user, donorProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await updateProfile(formData);
      setSuccessMsg('Profile and consent settings updated successfully.');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const isDonor = user?.role === 'donor';
  const lastDonated = donorProfile?.lastDonationDate
    ? new Date(donorProfile.lastDonationDate).toLocaleDateString()
    : 'No donation recorded yet';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Profile & Consent Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your account information, blood group, emergency contact, and privacy consents</p>
      </div>

      <DisclaimerBanner />

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isDonor && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase">Blood Group</span>
            <div className="text-3xl font-black text-red-600 mt-1">{formData.bloodGroup}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Recorded in donor registry</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Donations</span>
            <div className="text-3xl font-black text-slate-900 mt-1">{donorProfile?.totalDonationsCount || 0}</div>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Verified completed drives</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase">Last Donated</span>
            <div className="text-lg font-bold text-slate-800 mt-2">{lastDonated}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Standard 90-day recovery interval</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-xs">
        {/* Basic Info */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">Account Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Mobile Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Account Role</label>
              <input
                type="text"
                disabled
                value={user?.role?.toUpperCase() || ''}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-bold"
              />
            </div>
          </div>
        </div>

        {/* Donor Specific Profile Info */}
        {isDonor && (
          <>
            <div>
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">Donor Screening Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-red-600"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">Emergency Contact</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    value={formData.emergencyContact.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: { ...formData.emergencyContact, name: e.target.value },
                      })
                    }
                    placeholder="e.g. Spouse / Parent name"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Relationship</label>
                  <input
                    type="text"
                    value={formData.emergencyContact.relation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: { ...formData.emergencyContact, relation: e.target.value },
                      })
                    }
                    placeholder="e.g. Mother, Brother"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Emergency Phone</label>
                  <input
                    type="text"
                    value={formData.emergencyContact.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: { ...formData.emergencyContact, phone: e.target.value },
                      })
                    }
                    placeholder="+91 98765 00000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Consent & Privacy Section */}
            <div>
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">Consent & Privacy Governance</h2>
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.consentToStoreData}
                    onChange={(e) => setFormData({ ...formData, consentToStoreData: e.target.checked })}
                    className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                  />
                  <span className="text-xs text-slate-700">
                    <span className="font-semibold block">Donor Registry Consent</span>
                    I authorize the platform to securely store my donation history, blood group, and verified medical units in compliance with national privacy and health safety standards.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-slate-200">
                  <input
                    type="checkbox"
                    checked={formData.consentToContact}
                    onChange={(e) => setFormData({ ...formData, consentToContact: e.target.checked })}
                    className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                  />
                  <span className="text-xs text-slate-700">
                    <span className="font-semibold block">Emergency Blood Need Notifications</span>
                    Permit verified hospital blood banks and certified camp coordinators to send in-app or SMS alerts when critical shortages occur in my blood group.
                  </span>
                </label>
              </div>
            </div>
          </>
        )}

        <div className="flex items-center justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-red-500/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Profile & Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
