"use client";

import { useEffect, useState } from "react";
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
import { Separator } from "@workspace/ui/components/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  useUsersControllerGetCurrentUser,
  useUsersControllerUpdate,
  useUsersControllerChangePassword,
  useAuthControllerGetProfile,
  type ProfileResponseDto,
  type UpdateUserDto,
} from "@workspace/client";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@workspace/ui/components/select";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { CountryDropdown } from "@workspace/ui/components/country-dropdown";

type InfluencerFormState = {
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

export default function SettingsPage() {
  const [profileData, setProfileData] = useState({
    name: "",
    phone: "",
    company: "",
    mobileMoneyNumber: "",
    mobileMoneyNetwork: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [influencerFormError, setInfluencerFormError] = useState<string>("");
  const [influencerFormData, setInfluencerFormData] =
    useState<InfluencerFormState>({
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

  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useUsersControllerGetCurrentUser();

  const {
    data: profile,
    isLoading: isLoadingProfile,
    isError: isErrorProfile,
    refetch: refetchProfile,
  } = useAuthControllerGetProfile({
    query: {
      enabled: user?.role === "influencer",
    },
  });

  const typedProfile = profile as ProfileResponseDto | undefined;

  useEffect(() => {
    if (user?.role !== "influencer") return;
    if (!typedProfile) return;
    const profile = typedProfile as ProfileResponseDto & {
      country?: string;
      bankName?: string;
      bankAccountNumber?: string;
    };
    setInfluencerFormData({
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
  }, [typedProfile, user?.role]);

  const updateMutation = useUsersControllerUpdate({
    mutation: {
      onSuccess: () => {
        alert("Profile updated successfully");
        refetch();
      },
      onError: () => {
        alert("Failed to update profile");
      },
    },
  });

  const changePasswordMutation = useUsersControllerChangePassword({
    mutation: {
      onSuccess: () => {
        alert("Password changed successfully");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      },
      onError: () => {
        alert("Failed to change password. Check your current password.");
      },
    },
  });

  if (isLoading || (user?.role === "influencer" && isLoadingProfile)) {
    return <LoadingState text="Loading settings..." />;
  }

  if (isError || !user || (user.role === "influencer" && isErrorProfile)) {
    return (
      <ErrorState
        title="Failed to load settings"
        message="There was an error loading your settings."
        onRetry={() => {
          refetch();
          refetchProfile();
        }}
      />
    );
  }

  const handleProfileUpdate = () => {
    if (!user.id) return;

    updateMutation.mutate({
      id: user.id,
      data: {
        name: profileData.name || user.name,
        phone: profileData.phone || user.phone,
        company: profileData.company || user.company,
        mobileMoneyNumber: profileData.mobileMoneyNumber || undefined,
        mobileMoneyNetwork:
          (profileData.mobileMoneyNetwork as UpdateUserDto["mobileMoneyNetwork"]) ||
          undefined,
      },
    });
  };

  const isGhana = influencerFormData.country === "GHA";

  const validateInfluencerForm = () => {
    if (!influencerFormData.country) {
      setInfluencerFormError("Country is required");
      return false;
    }
    if (!influencerFormData.city.trim()) {
      setInfluencerFormError("City / Town / Village is required");
      return false;
    }
    if (isGhana) {
      if (!influencerFormData.mobileMoneyNumber.trim()) {
        setInfluencerFormError("Mobile money number is required");
        return false;
      }
      if (!influencerFormData.mobileMoneyNetwork) {
        setInfluencerFormError("Mobile money network is required");
        return false;
      }
    } else {
      if (!influencerFormData.bankName.trim()) {
        setInfluencerFormError("Bank name is required");
        return false;
      }
      if (!influencerFormData.bankAccountNumber.trim()) {
        setInfluencerFormError("Bank account number is required");
        return false;
      }
    }
    if (!influencerFormData.occupation.trim()) {
      setInfluencerFormError("Occupation is required");
      return false;
    }
    if (influencerFormData.isStudent && !influencerFormData.schoolName.trim()) {
      setInfluencerFormError("School name is required for students");
      return false;
    }
    if (!influencerFormData.gender) {
      setInfluencerFormError("Gender is required");
      return false;
    }
    if (!influencerFormData.ageBracket) {
      setInfluencerFormError("Age bracket is required");
      return false;
    }

    setInfluencerFormError("");
    return true;
  };

  const handleInfluencerCompleteProfileUpdate = () => {
    if (!user.id) return;
    if (!validateInfluencerForm()) return;

    const payload: UpdateUserDto & {
      country?: string;
      bankName?: string;
      bankAccountNumber?: string;
    } = {
      country: influencerFormData.country,
      city: influencerFormData.city,
      mobileMoneyNumber: isGhana
        ? influencerFormData.mobileMoneyNumber
        : undefined,
      mobileMoneyNetwork: isGhana
        ? (influencerFormData.mobileMoneyNetwork as UpdateUserDto["mobileMoneyNetwork"])
        : undefined,
      bankName: !isGhana ? influencerFormData.bankName : undefined,
      bankAccountNumber: !isGhana
        ? influencerFormData.bankAccountNumber
        : undefined,
      occupation: influencerFormData.occupation,
      isStudent: influencerFormData.isStudent,
      schoolName: influencerFormData.isStudent
        ? influencerFormData.schoolName
        : undefined,
      gender: influencerFormData.gender as UpdateUserDto["gender"],
      ageBracket: influencerFormData.ageBracket as UpdateUserDto["ageBracket"],
    };

    updateMutation.mutate({
      id: user.id,
      data: payload,
    });
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    changePasswordMutation.mutate({
      data: {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      },
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            {/* <TabsTrigger value="notifications">Notifications</TabsTrigger> */}
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      defaultValue={user.name || ""}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={user.email}
                      disabled
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      defaultValue={user.phone || ""}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>
                  {user.role === "client" && (
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        defaultValue={user.company || ""}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            company: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleProfileUpdate}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>

            {user?.role === "influencer" &&
              typedProfile?.status === "approved" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Complete Profile</CardTitle>
                    <CardDescription>
                      Update your influencer profile details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {influencerFormError && (
                      <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        {influencerFormError}
                      </div>
                    )}

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">
                        Payment Information
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="country">Country *</Label>
                          <CountryDropdown
                            placeholder="Select country"
                            defaultValue={influencerFormData.country}
                            onChange={(country) =>
                              setInfluencerFormData((p) => ({
                                ...p,
                                country: country.alpha3,
                              }))
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="city">City / Town / Village *</Label>
                          <Input
                            id="city"
                            type="text"
                            placeholder="e.g., Accra, Kumasi, Tamale"
                            value={influencerFormData.city}
                            onChange={(e) =>
                              setInfluencerFormData((p) => ({
                                ...p,
                                city: e.target.value,
                              }))
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
                              value={influencerFormData.mobileMoneyNumber}
                              onChange={(e) =>
                                setInfluencerFormData((p) => ({
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
                              value={influencerFormData.mobileMoneyNetwork}
                              onValueChange={(value) =>
                                setInfluencerFormData((p) => ({
                                  ...p,
                                  mobileMoneyNetwork:
                                    value as InfluencerFormState["mobileMoneyNetwork"],
                                }))
                              }
                            >
                              <SelectTrigger id="mobileMoneyNetwork">
                                <SelectValue placeholder="Select network" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MTN">
                                  MTN Mobile Money
                                </SelectItem>
                                <SelectItem value="Vodafone">
                                  Vodafone Cash
                                </SelectItem>
                                <SelectItem value="AirtelTigo">
                                  AirtelTigo Money
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ) : influencerFormData.country ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="bankName">Bank Name *</Label>
                            <Input
                              id="bankName"
                              type="text"
                              placeholder="e.g., Bank of America"
                              value={influencerFormData.bankName}
                              onChange={(e) =>
                                setInfluencerFormData((p) => ({
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
                              value={influencerFormData.bankAccountNumber}
                              onChange={(e) =>
                                setInfluencerFormData((p) => ({
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
                      <h3 className="text-lg font-medium">
                        Personal Information
                      </h3>

                      <div className="space-y-2">
                        <Label htmlFor="occupation">Occupation *</Label>
                        <Input
                          id="occupation"
                          type="text"
                          placeholder="e.g., Marketing Manager, Student"
                          value={influencerFormData.occupation}
                          onChange={(e) =>
                            setInfluencerFormData((p) => ({
                              ...p,
                              occupation: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isStudent"
                          checked={influencerFormData.isStudent}
                          onCheckedChange={(checked) =>
                            setInfluencerFormData((p) => ({
                              ...p,
                              isStudent: !!checked,
                            }))
                          }
                        />
                        <Label htmlFor="isStudent">
                          I am currently a student
                        </Label>
                      </div>

                      {influencerFormData.isStudent && (
                        <div className="space-y-2">
                          <Label htmlFor="schoolName">
                            School/University Name *
                          </Label>

                          <Select
                            value={influencerFormData.schoolName}
                            onValueChange={(value) =>
                              setInfluencerFormData((p) => ({
                                ...p,
                                schoolName:
                                  value as InfluencerFormState["schoolName"],
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
                            value={influencerFormData.gender}
                            onValueChange={(value) =>
                              setInfluencerFormData((p) => ({
                                ...p,
                                gender: value as InfluencerFormState["gender"],
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
                            value={influencerFormData.ageBracket}
                            onValueChange={(value) =>
                              setInfluencerFormData((p) => ({
                                ...p,
                                ageBracket:
                                  value as InfluencerFormState["ageBracket"],
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
                      onClick={handleInfluencerCompleteProfileUpdate}
                      disabled={updateMutation.isPending}
                      className="w-full"
                    >
                      {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </CardContent>
                </Card>
              )}

            {user?.role === "influencer" &&
              typedProfile?.status !== "approved" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Profile completion unavailable</CardTitle>
                    <CardDescription>
                      Your influencer account must be approved before completing
                      your profile.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    onChange={(e) => {
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      });
                    }}
                    id="current-password"
                    type="password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    onChange={(e) => {
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      });
                    }}
                    id="new-password"
                    type="password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    onChange={(e) => {
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      });
                    }}
                    id="confirm-password"
                    type="password"
                  />
                </div>
                <Button
                  onClick={handlePasswordChange}
                  disabled={changePasswordMutation.isPending}
                >
                  Update Password
                </Button>
              </CardContent>
            </Card>

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive">Delete Account</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">
                      Receive updates via email
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enabled
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Campaign Updates</p>
                    <p className="text-xs text-muted-foreground">
                      Get notified about new campaigns
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enabled
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Payment Alerts</p>
                    <p className="text-xs text-muted-foreground">
                      Receive payment confirmations
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enabled
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
