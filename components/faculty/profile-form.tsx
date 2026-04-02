"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Plus, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Field, FieldGroup, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { toast } from "sonner";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations/faculty";
import type { FacultyProfile } from "@/lib/types/faculty";

interface ProfileFormProps {
  profile: FacultyProfile;
  onSave?: (data: UpdateProfileInput) => Promise<void>;
  isSubmitting?: boolean;
}

export function ProfileForm({ profile, onSave, isSubmitting: externalSubmitting }: ProfileFormProps) {
  const [internalSubmitting, setInternalSubmitting] = useState(false);
  const isSubmitting = externalSubmitting ?? internalSubmitting;
  const [newInterest, setNewInterest] = useState("");
  const [newQualification, setNewQualification] = useState("");
  const [newPublication, setNewPublication] = useState("");

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      bio: profile.bio ?? "",
      phone: profile.phone ?? "",
      officeLocation: profile.officeLocation ?? "",
      officeHours: profile.officeHours ?? "",
      researchInterests: profile.researchInterests ?? [],
      qualifications: profile.qualifications ?? [],
      publications: profile.publications ?? [],
      socialLinks: profile.socialLinks ?? {},
    },
  });

  const { register, watch, setValue, formState: { errors } } = form;
  const researchInterests = watch("researchInterests") ?? [];
  const qualifications = watch("qualifications") ?? [];
  const publications = watch("publications") ?? [];

  const addItem = (
    field: "researchInterests" | "qualifications" | "publications",
    value: string,
    setter: (v: string) => void
  ) => {
    if (!value.trim()) return;
    const current = watch(field) ?? [];
    setValue(field, [...current, value.trim()]);
    setter("");
  };

  const removeItem = (
    field: "researchInterests" | "qualifications" | "publications",
    index: number
  ) => {
    const current = watch(field) ?? [];
    setValue(field, current.filter((_, i) => i !== index));
  };

  const handleSubmit = async (data: UpdateProfileInput) => {
    if (onSave) {
      await onSave(data);
    } else {
      setInternalSubmitting(true);
      try {
        const res = await fetch("/api/faculty/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update profile");
        toast.success("Profile updated successfully");
      } catch {
        toast.error("Failed to update profile");
      } finally {
        setInternalSubmitting(false);
      }
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Update your personal and contact information</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="bio">Bio</FieldLabel>
              <Textarea
                id="bio"
                {...register("bio")}
                placeholder="Tell us about yourself..."
                className="min-h-[120px] resize-none"
              />
              <FieldDescription>Brief description about your expertise and background</FieldDescription>
              {errors.bio && <FieldError>{errors.bio.message}</FieldError>}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                <Input id="phone" {...register("phone")} placeholder="+1-555-123-4567" />
                {errors.phone && <FieldError>{errors.phone.message}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="officeLocation">Office Location</FieldLabel>
                <Input id="officeLocation" {...register("officeLocation")} placeholder="Building, Room" />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="officeHours">Office Hours</FieldLabel>
              <Textarea
                id="officeHours"
                {...register("officeHours")}
                placeholder="Mon & Wed: 2:00 PM - 4:00 PM"
                className="min-h-[80px] resize-none"
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Research Interests */}
      <Card>
        <CardHeader>
          <CardTitle>Research Interests</CardTitle>
          <CardDescription>Areas of research and expertise</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {researchInterests.map((interest, index) => (
              <Badge key={index} variant="secondary" className="gap-1 py-1 pl-3 pr-1">
                {interest}
                <button
                  type="button"
                  onClick={() => removeItem("researchInterests", index)}
                  className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              placeholder="Add research interest"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem("researchInterests", newInterest, setNewInterest);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => addItem("researchInterests", newInterest, setNewInterest)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Qualifications */}
      <Card>
        <CardHeader>
          <CardTitle>Qualifications</CardTitle>
          <CardDescription>Your educational background and certifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {qualifications.map((qual, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-2.5"
              >
                <span className="text-sm">{qual}</span>
                <button
                  type="button"
                  onClick={() => removeItem("qualifications", index)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newQualification}
              onChange={(e) => setNewQualification(e.target.value)}
              placeholder="Add qualification (e.g., Ph.D. in Computer Science, MIT)"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem("qualifications", newQualification, setNewQualification);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => addItem("qualifications", newQualification, setNewQualification)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Publications */}
      <Card>
        <CardHeader>
          <CardTitle>Publications</CardTitle>
          <CardDescription>Your published research papers and articles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {publications.map((pub, index) => (
              <div
                key={index}
                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-2.5"
              >
                <span className="text-sm leading-relaxed">{pub}</span>
                <button
                  type="button"
                  onClick={() => removeItem("publications", index)}
                  className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newPublication}
              onChange={(e) => setNewPublication(e.target.value)}
              placeholder="Add publication citation"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem("publications", newPublication, setNewPublication);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => addItem("publications", newPublication, setNewPublication)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="min-w-32">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
