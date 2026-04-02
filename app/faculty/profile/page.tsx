"use client";

import { useState, useEffect } from "react";
import { useProfile, useUpdateProfile } from "@/hooks/use-faculty";
import { useRoleAuth } from "@/hooks/use-role-auth";
import { ReadOnlyBanner } from "@/components/role-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials } from "@/lib/utils";
import {
  Save,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Clock,
  GraduationCap,
  BookOpen,
  FileText,
  Globe,
  Linkedin,
  Github,
  Plus,
  X,
  Briefcase,
  Calendar,
  Building2,
  Hash,
  ExternalLink,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { data: profile, isLoading, mutate } = useProfile();
  const { trigger: updateProfile, isMutating } = useUpdateProfile();
  const { can, isScheduler, user } = useRoleAuth();
  const canEdit = can("profile:edit:own");

  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [officeLocation, setOfficeLocation] = useState("");
  const [officeHours, setOfficeHours] = useState("");
  const [researchInterests, setResearchInterests] = useState<string[]>([]);
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [publications, setPublications] = useState<string[]>([]);
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [scholar, setScholar] = useState("");
  const [website, setWebsite] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [newQualification, setNewQualification] = useState("");
  const [newPublication, setNewPublication] = useState("");

  useEffect(() => {
    if (profile) {
      const d = profile as any;
      const prof = d.profile || d;
      setBio(prof.bio || "");
      setPhone(prof.phone || "");
      setOfficeLocation(prof.officeLocation || prof.office_location || "");
      setOfficeHours(prof.officeHours || prof.office_hours || "");
      setResearchInterests(prof.researchInterests || prof.research_interests || []);
      setQualifications(prof.qualifications || []);
      setPublications(prof.publications || []);
      const links = prof.socialLinks || prof.social_links || {};
      setLinkedin(links.linkedin || "");
      setGithub(links.github || "");
      setScholar(links.scholar || links.googleScholar || "");
      setWebsite(links.website || "");
    }
  }, [profile]);

  async function handleSave() {
    try {
      await updateProfile({
        bio,
        phone,
        officeLocation,
        officeHours,
        researchInterests,
        qualifications,
        publications,
        socialLinks: { linkedin, github, scholar, website },
      } as any);
      toast.success("Profile updated successfully");
      setIsEditing(false);
      mutate();
    } catch {
      toast.error("Failed to update profile");
    }
  }

  function handleCancel() {
    if (profile) {
      const d = profile as any;
      const prof = d.profile || d;
      setBio(prof.bio || "");
      setPhone(prof.phone || "");
      setOfficeLocation(prof.officeLocation || "");
      setOfficeHours(prof.officeHours || "");
      setResearchInterests(prof.researchInterests || []);
      setQualifications(prof.qualifications || []);
      setPublications(prof.publications || []);
      const links = prof.socialLinks || {};
      setLinkedin(links.linkedin || "");
      setGithub(links.github || "");
      setScholar(links.scholar || "");
      setWebsite(links.website || "");
    }
    setIsEditing(false);
  }

  function addItem(
    list: string[],
    setList: (v: string[]) => void,
    value: string,
    setValue: (v: string) => void,
    max: number
  ) {
    if (value.trim() && list.length < max) {
      setList([...list, value.trim()]);
      setValue("");
    }
  }

  function removeItem(
    list: string[],
    setList: (v: string[]) => void,
    idx: number
  ) {
    setList(list.filter((_, i) => i !== idx));
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const d = (profile || {}) as any;
  const fac = d.faculty || {};
  const facUser = fac.user || {};
  const facDept = fac.department || {};
  const name = facUser.name || user?.name || "Faculty Member";
  const email = facUser.email || user?.email || "";
  const designation = fac.designation || "Professor";
  const department = facDept.name || "Department";
  const employeeId = fac.employeeId || fac.employee_id || "N/A";
  const joiningDate = fac.joiningDate || fac.joining_date || "";

  return (
    <div className="space-y-6">
      {isScheduler && <ReadOnlyBanner />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-sm text-muted-foreground">
            {canEdit
              ? "Manage your professional information"
              : "View faculty profile information"}
          </p>
        </div>
        {canEdit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Hero Card */}
      <Card>
        <CardContent className="p-0">
          <div className="h-32 rounded-t-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600" />
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-card bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-3xl font-bold shadow-lg shrink-0">
                {getInitials(name)}
              </div>
              <div className="flex-1 sm:pb-1">
                <h2 className="text-xl font-bold">{name}</h2>
                <p className="text-sm text-muted-foreground">{designation}</p>
              </div>
              <div className="flex gap-6 sm:pb-1">
                <div className="text-center">
                  <p className="text-lg font-bold">{researchInterests.length}</p>
                  <p className="text-[11px] text-muted-foreground">Research Areas</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{publications.length}</p>
                  <p className="text-[11px] text-muted-foreground">Publications</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{qualifications.length}</p>
                  <p className="text-[11px] text-muted-foreground">Qualifications</p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3" /> {department}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" /> {email}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                <Hash className="h-3 w-3" /> {employeeId}
              </span>
              {joiningDate && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" /> Joined{" "}
                  {new Date(joiningDate).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                About
              </h3>
              {isEditing ? (
                <div>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={5}
                    placeholder="Write about yourself..."
                    className="w-full rounded-lg border border-border bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground text-right">
                    {bio.length}/1000
                  </p>
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {bio || "No bio added yet."}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Research Interests */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Research Interests
                </h3>
                <span className="text-xs text-muted-foreground">
                  {researchInterests.length}/20
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {researchInterests.length === 0 && !isEditing && (
                  <p className="text-sm text-muted-foreground">
                    No research interests added
                  </p>
                )}
                {researchInterests.map((item, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300"
                  >
                    {item}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() =>
                          removeItem(researchInterests, setResearchInterests, i)
                        }
                        className="hover:text-red-500 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {isEditing && (
                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    placeholder="Add research interest..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addItem(
                          researchInterests,
                          setResearchInterests,
                          newInterest,
                          setNewInterest,
                          20
                        );
                      }
                    }}
                    className="flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      addItem(
                        researchInterests,
                        setResearchInterests,
                        newInterest,
                        setNewInterest,
                        20
                      )
                    }
                    className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-500 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Qualifications */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" /> Qualifications
                </h3>
                <span className="text-xs text-muted-foreground">
                  {qualifications.length}/10
                </span>
              </div>
              <div className="space-y-2">
                {qualifications.length === 0 && !isEditing && (
                  <p className="text-sm text-muted-foreground">
                    No qualifications added
                  </p>
                )}
                {qualifications.map((item, i) => (
                  <div
                    key={i}
                    className="group flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950 shrink-0">
                      <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm flex-1">{item}</span>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => removeItem(qualifications, setQualifications, i)}
                        className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {isEditing && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={newQualification}
                    onChange={(e) => setNewQualification(e.target.value)}
                    placeholder="e.g. Ph.D. in Computer Science — MIT"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addItem(
                          qualifications,
                          setQualifications,
                          newQualification,
                          setNewQualification,
                          10
                        );
                      }
                    }}
                    className="flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      addItem(
                        qualifications,
                        setQualifications,
                        newQualification,
                        setNewQualification,
                        10
                      )
                    }
                    className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-500 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Publications */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Publications
                </h3>
                <span className="text-xs text-muted-foreground">
                  {publications.length}/50
                </span>
              </div>
              <div className="space-y-2">
                {publications.length === 0 && !isEditing && (
                  <p className="text-sm text-muted-foreground">
                    No publications added
                  </p>
                )}
                {publications.map((item, i) => (
                  <div
                    key={i}
                    className="group flex items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm flex-1 leading-relaxed">{item}</span>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => removeItem(publications, setPublications, i)}
                        className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all mt-0.5"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {isEditing && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={newPublication}
                    onChange={(e) => setNewPublication(e.target.value)}
                    placeholder="Title — Journal/Conference — Year"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addItem(
                          publications,
                          setPublications,
                          newPublication,
                          setNewPublication,
                          50
                        );
                      }
                    }}
                    className="flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      addItem(
                        publications,
                        setPublications,
                        newPublication,
                        setNewPublication,
                        50
                      )
                    }
                    className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-500 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Contact */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Contact
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Email
                    </p>
                    <p className="text-sm truncate">{email || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Phone
                    </p>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1-555-0123"
                        className="mt-1 w-full rounded border border-border bg-transparent px-2 py-1 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-sm">{phone || "Not set"}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Office
                    </p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={officeLocation}
                        onChange={(e) => setOfficeLocation(e.target.value)}
                        placeholder="CS Block, Room 201"
                        className="mt-1 w-full rounded border border-border bg-transparent px-2 py-1 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-sm">{officeLocation || "Not set"}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Office Hours
                    </p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={officeHours}
                        onChange={(e) => setOfficeHours(e.target.value)}
                        placeholder="Mon & Fri 2-4 PM"
                        className="mt-1 w-full rounded border border-border bg-transparent px-2 py-1 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-sm">{officeHours || "Not set"}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Links
              </h3>
              {isEditing ? (
                <div className="space-y-3">
                  {[
                    {
                      icon: Linkedin,
                      label: "LinkedIn",
                      value: linkedin,
                      setter: setLinkedin,
                      placeholder: "https://linkedin.com/in/...",
                    },
                    {
                      icon: Github,
                      label: "GitHub",
                      value: github,
                      setter: setGithub,
                      placeholder: "https://github.com/...",
                    },
                    {
                      icon: GraduationCap,
                      label: "Google Scholar",
                      value: scholar,
                      setter: setScholar,
                      placeholder: "https://scholar.google.com/...",
                    },
                    {
                      icon: Globe,
                      label: "Website",
                      value: website,
                      setter: setWebsite,
                      placeholder: "https://yoursite.com",
                    },
                  ].map((link) => (
                    <div key={link.label}>
                      <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        <link.icon className="h-3 w-3" /> {link.label}
                      </label>
                      <input
                        type="url"
                        value={link.value}
                        onChange={(e) => link.setter(e.target.value)}
                        placeholder={link.placeholder}
                        className="w-full rounded border border-border bg-transparent px-2 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {[
                    {
                      icon: Linkedin,
                      label: "LinkedIn",
                      value: linkedin,
                      color: "text-[#0077B5]",
                    },
                    {
                      icon: Github,
                      label: "GitHub",
                      value: github,
                      color: "text-foreground",
                    },
                    {
                      icon: GraduationCap,
                      label: "Google Scholar",
                      value: scholar,
                      color: "text-[#4285F4]",
                    },
                    {
                      icon: Globe,
                      label: "Website",
                      value: website,
                      color: "text-green-600 dark:text-green-400",
                    },
                  ].map((link) =>
                    link.value ? (
                      <a
                        key={link.label}
                        href={link.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors group"
                      >
                        <link.icon className={`h-4 w-4 ${link.color}`} />
                        <span className="text-sm flex-1">{link.label}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ) : null
                  )}
                  {!linkedin && !github && !scholar && !website && (
                    <p className="text-sm text-muted-foreground">No links added</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Department Info */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Department
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Department
                  </p>
                  <p className="text-sm font-medium">{department}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Designation
                  </p>
                  <p className="text-sm font-medium">{designation}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Employee ID
                  </p>
                  <p className="text-sm font-mono">{employeeId}</p>
                </div>
              </div>
              <p className="mt-4 text-[11px] text-muted-foreground">
                Contact your department admin to update these fields
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky Save Bar */}
      {isEditing && (
        <div className="sticky bottom-0 -mx-6 -mb-6 border-t border-border bg-card/95 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">You have unsaved changes</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isMutating}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 transition-colors"
              >
                {isMutating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
