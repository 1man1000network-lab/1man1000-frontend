"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAuthControllerGetProfile,
  useUsersControllerUpdate,
  type ProfileResponseDto,
  type UpdateUserDto,
  getAuthControllerGetProfileQueryKey,
} from "@workspace/client";
import { useAuthStore } from "@/lib/auth-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { CountryDropdown } from "@workspace/ui/components/country-dropdown";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";

type FormState = {
  country: string;
  city: string;
  mobileMoneyNumber: string;
  mobileMoneyNetwork: "MTN" | "Vodafone" | "AirtelTigo" | "";
  bankName: string;
  bankAccountNumber: string;
  occupation: string;
  isStudent: boolean;
  schoolName: string;
  gender: "Male" | "Female" | "Other" | "PreferNotToSay" | "";
  ageBracket:
    | "age_18_24"
    | "age_25_34"
    | "age_35_44"
    | "age_45_54"
    | "age_55_plus"
    | "";
};

const allSchoolOptions = [
  "University of Ghana",
  "Kwame Nkrumah University of Science and Technology",
  "University of Cape Coast",
  "Ashesi University",
  "Ghana Institute of Management and Public Administration",
  "University of Professional Studies, Accra",
  "Central University",
  "Methodist University College Ghana",
  "Accra Institute of Technology",
  "Regent University College",
  "Valley View University",
  "University of Education, Winneba",
  "Takoradi Technical University",
  "Kumasi Technical University",
  "Ghana Technology University College",
  "Cape Coast Technical University",
  "Accra Technical University",
  "Koforidua Technical University",
  "Sunyani Technical University",
  "Ho Technical University",
  "Faso College of Accra",
  "Islamic University College",
  "Wisconsin International University College",
  "Ghana-India Education Centre",
  "Pan African University",
  "Pearlfield University College",
  "EMS College of Education",
  "Akenten Appiah-Menka University of Skills Training and Entrepreneurial Development",
];

export default function InfluencerCompleteProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [formError, setFormError] = useState<string>("");

  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = useAuthControllerGetProfile({
    query: {
      enabled: !!user,
    },
  });

  const typedProfile = profile as ProfileResponseDto | undefined;

  const [formData, setFormData] = useState<FormState>({
    country: "",
    city: "",
    mobileMoneyNumber: "",
    mobileMoneyNetwork: "",
    bankName: "",
    bankAccountNumber: "",
    occupation: "",
    isStudent: false,
    schoolName: "",
    gender: "",
    ageBracket: "",
  });

  useEffect(() => {
    if (!typedProfile) return;
    const profile = typedProfile as ProfileResponseDto;
    setFormData({
      country: profile.country || "",
      city: profile.city || "",
      mobileMoneyNumber: profile.mobileMoneyNumber || "",
      mobileMoneyNetwork: profile.mobileMoneyNetwork || "",
      bankName: profile.bankName || "",
      bankAccountNumber: profile.bankAccountNumber || "",
      occupation: profile.occupation || "",
      isStudent: profile.isStudent || false,
      schoolName: profile.schoolName || "",
      gender: profile.gender || "",
      ageBracket: profile.ageBracket || "",
    });
  }, [typedProfile]);

  console.log(formData);

  const updateMutation = useUsersControllerUpdate({
    mutation: {
      onSuccess: async () => {
        // Force refresh profile query to get updated data
        await queryClient.invalidateQueries({
          queryKey: getAuthControllerGetProfileQueryKey(),
        });
        router.push("/influencer");
      },
      onError: (e: unknown) => {
        const message =
          typeof e === "object" && e !== null
            ? (e as { response?: { data?: { message?: string } } }).response
                ?.data?.message
            : undefined;
        setFormError(message || "Failed to update profile. Try again.");
      },
    },
  });

  if (isLoading) return <LoadingState text="Loading profile..." />;

  if (isError || !typedProfile || !user) {
    return (
      <ErrorState
        title="Failed to load profile"
        message="There was an error loading your profile information."
        onRetry={() => refetch()}
      />
    );
  }

  if (user.role !== "influencer") {
    return null;
  }

  if (typedProfile.status !== "approved") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile completion unavailable</CardTitle>
          <CardDescription>
            Your influencer account must be approved before completing your
            profile.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isGhana = formData.country === "GHA";

  const validate = () => {
    if (!formData.country) {
      setFormError("Country is required");
      return false;
    }
    if (!formData.city.trim()) {
      setFormError("City / Town / Village is required");
      return false;
    }
    if (isGhana) {
      if (!formData.mobileMoneyNumber.trim()) {
        setFormError("Mobile money number is required");
        return false;
      }
      if (!formData.mobileMoneyNetwork) {
        setFormError("Mobile money network is required");
        return false;
      }
    } else {
      if (!formData.bankName.trim()) {
        setFormError("Bank name is required");
        return false;
      }
      if (!formData.bankAccountNumber.trim()) {
        setFormError("Bank account number is required");
        return false;
      }
    }
    if (!formData.occupation.trim()) {
      setFormError("Occupation is required");
      return false;
    }
    if (formData.isStudent && !formData.schoolName.trim()) {
      setFormError("School name is required for students");
      return false;
    }
    if (!formData.gender) {
      setFormError("Gender is required");
      return false;
    }
    if (!formData.ageBracket) {
      setFormError("Age bracket is required");
      return false;
    }

    setFormError("");
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: UpdateUserDto & {
      country?: string;
      bankName?: string;
      bankAccountNumber?: string;
    } = {
      country: formData.country,
      city: formData.city,
      mobileMoneyNumber: isGhana ? formData.mobileMoneyNumber : undefined,
      mobileMoneyNetwork: isGhana
        ? (formData.mobileMoneyNetwork as UpdateUserDto["mobileMoneyNetwork"])
        : undefined,
      bankName: !isGhana ? formData.bankName : undefined,
      bankAccountNumber: !isGhana ? formData.bankAccountNumber : undefined,
      occupation: formData.occupation,
      isStudent: formData.isStudent,
      schoolName: formData.isStudent ? formData.schoolName : undefined,
      gender: formData.gender as UpdateUserDto["gender"],
      ageBracket: formData.ageBracket as UpdateUserDto["ageBracket"],
    };

    await updateMutation.mutateAsync({
      id: typedProfile.id,
      data: payload,
    });
  };

  return (
    <div className="max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            Please provide additional information to complete your influencer
            profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            {formError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Payment Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <CountryDropdown
                    placeholder="Select country"
                    defaultValue={formData.country}
                    onChange={(country) =>
                      setFormData((p) => ({ ...p, country: country.alpha3 }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City / Town / Village *</Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="e.g., Accra, Kumasi, Tamale"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, city: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              {isGhana ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobileMoneyNumber">
                      Mobile Money Number *
                    </Label>
                    <Input
                      id="mobileMoneyNumber"
                      type="tel"
                      placeholder="e.g., 0241234567"
                      value={formData.mobileMoneyNumber}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          mobileMoneyNumber: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobileMoneyNetwork">
                      Mobile Money Network *
                    </Label>
                    <Select
                      value={formData.mobileMoneyNetwork}
                      onValueChange={(value) =>
                        setFormData((p) => ({
                          ...p,
                          mobileMoneyNetwork:
                            value as FormState["mobileMoneyNetwork"],
                        }))
                      }
                    >
                      <SelectTrigger id="mobileMoneyNetwork">
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MTN">MTN Mobile Money</SelectItem>
                        <SelectItem value="Vodafone">Vodafone Cash</SelectItem>
                        <SelectItem value="AirtelTigo">
                          AirtelTigo Money
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : formData.country ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name *</Label>
                    <Input
                      id="bankName"
                      type="text"
                      placeholder="e.g., Bank of America"
                      value={formData.bankName}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          bankName: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankAccountNumber">
                      Bank Account Number *
                    </Label>
                    <Input
                      id="bankAccountNumber"
                      type="text"
                      placeholder="e.g., 1234567890"
                      value={formData.bankAccountNumber}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          bankAccountNumber: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>

              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation *</Label>
                <Input
                  id="occupation"
                  type="text"
                  placeholder="e.g., Marketing Manager, Student"
                  value={formData.occupation}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, occupation: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isStudent"
                  key={formData.isStudent ? "checked" : "unchecked"}
                  checked={formData.isStudent}
                  onCheckedChange={(checked) =>
                    setFormData((p) => ({ ...p, isStudent: !!checked }))
                  }
                />
                <Label htmlFor="isStudent">I am currently a student</Label>
              </div>

              {formData.isStudent && (
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School/University Name *</Label>

                  <Select
                    key={formData.schoolName}
                    value={formData.schoolName}
                    onValueChange={(value) =>
                      setFormData((p) => ({
                        ...p,
                        schoolName: value as FormState["schoolName"],
                      }))
                    }
                  >
                    <SelectTrigger id="schoolName">
                      <SelectValue placeholder="Select school" />
                    </SelectTrigger>
                    <SelectContent>
                      {allSchoolOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select
                    key={formData.gender}
                    value={formData.gender}
                    onValueChange={(value) =>
                      setFormData((p) => ({
                        ...p,
                        gender: value as FormState["gender"],
                      }))
                    }
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                      <SelectItem value="PreferNotToSay">
                        Prefer not to say
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ageBracket">Age Bracket *</Label>
                  <Select
                    key={formData.ageBracket}
                    value={formData.ageBracket}
                    onValueChange={(value) =>
                      setFormData((p) => ({
                        ...p,
                        ageBracket: value as FormState["ageBracket"],
                      }))
                    }
                  >
                    <SelectTrigger id="ageBracket">
                      <SelectValue placeholder="Select age range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="age_18_24">18-24</SelectItem>
                      <SelectItem value="age_25_34">25-34</SelectItem>
                      <SelectItem value="age_35_44">35-44</SelectItem>
                      <SelectItem value="age_45_54">45-54</SelectItem>
                      <SelectItem value="age_55_plus">55+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending
                ? "Updating Profile..."
                : "Complete Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
