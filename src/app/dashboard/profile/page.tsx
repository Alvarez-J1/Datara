"use client";

import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import {
  Avatar,
  Button,
  Checkbox,
  Chip,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import Footer from "@/components/Footer/Footer";
import { updateProfile } from "@/lib/api/auth";
import { ApiError, useAuthUser } from "@/lib/api/client";
import { useDemoMode } from "@/lib/demoMode";
import { type ChangeEvent, type FormEvent, useState } from "react";
import scss from "./Profile.module.scss";

type ProfileFormData = {
  email: string;
  firstName: string;
  lastName: string;
  receiveEmails: boolean;
};

const getProfileDefaults = (
  name?: string | null,
  email?: string | null
): ProfileFormData => {
  const names = name ? name.split(" ") : [];

  return {
    email: email || "",
    firstName: names[0] || "",
    lastName: names.length > 1 ? names[names.length - 1] : "",
    receiveEmails: false,
  };
};

export default function Profile() {
  const authUser = useAuthUser();
  const isDemoMode = useDemoMode();
  const theme = useTheme();
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [formData, setFormData] = useState<Partial<ProfileFormData>>({
    receiveEmails: false,
  });
  const displayName = authUser?.name;
  const displayEmail = authUser?.email;
  const sessionDefaults = getProfileDefaults(displayName, displayEmail);
  const visibleFormData: ProfileFormData = {
    ...sessionDefaults,
    ...formData,
    receiveEmails: formData.receiveEmails ?? false,
  };

  // The shared demo/admin account is intentionally locked server-side, so it
  // gets a read-only view instead of a save action that would just fail.
  const isEditable = !isDemoMode;

  const handleFormChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;

    setSaved(false);
    setSaveError("");
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isEditable) {
      return;
    }

    setSaved(false);
    setSaveError("");
    setIsSaving(true);

    const name = `${visibleFormData.firstName} ${visibleFormData.lastName}`.trim();

    try {
      await updateProfile({ email: visibleFormData.email, name });
      setSaved(true);
    } catch (error) {
      setSaveError(
        error instanceof ApiError
          ? error.message
          : "Unable to save your profile. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const fieldStyles = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px",
      transition: "box-shadow 160ms ease, border-color 160ms ease",
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: alpha(theme.palette.secondary.main, 0.55),
      },
      "&.Mui-focused": {
        boxShadow: `0 0 0 3px ${alpha(theme.palette.secondary.main, 0.1)}`,
      },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.secondary.main,
      },
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: theme.palette.secondary.main,
    },
  };

  return (
    <main className={scss.profilePage}>
      <section className={scss.pageHeader}>
        <div>
          <Typography className={scss.eyebrow}>ACCOUNT SETTINGS</Typography>
          <Typography component="h1" variant="h3">
            Profile
          </Typography>
          <Typography className={scss.pageDescription}>
            Manage your Datara identity, contact details, and account
            preferences in one focused workspace.
          </Typography>
        </div>

        {saved && (
          <Chip
            className={scss.savedChip}
            label="Profile updated"
            role="status"
            size="small"
            variant="outlined"
          />
        )}
      </section>

      <Paper
        className={scss.profileCard}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 10px 24px rgba(0, 0, 0, 0.18)"
              : "0 10px 24px rgba(15, 23, 42, 0.05)",
        }}
      >
        <aside className={scss.profileSummary}>
          <div className={scss.avatarWrap}>
            <Avatar
              alt={displayName || "User"}
              className={scss.avatar}
              sx={{
                height: 96,
                width: 96,
              }}
            />
            <span className={scss.avatarStatus} aria-label="Active user" />
          </div>

          <div>
            <Typography className={scss.profileName}>
              {displayName || "Datara user"}
            </Typography>
            <Typography className={scss.profileRole}>
            Revenue analytics dashboard
            </Typography>
          </div>

          <div className={scss.metaList}>
            <div className={scss.metaItem}>
              <EmailOutlinedIcon aria-hidden="true" fontSize="small" />
              <span>{displayEmail || "No email available"}</span>
            </div>
            <div className={scss.metaItem}>
              <ShieldOutlinedIcon aria-hidden="true" fontSize="small" />
              <span>
                {isDemoMode ? "Shared demo account (read-only)" : "Password protected"}
              </span>
            </div>
            <div className={scss.metaItem}>
              <BadgeOutlinedIcon aria-hidden="true" fontSize="small" />
              <span>Workspace access enabled</span>
            </div>
          </div>
        </aside>

        <section className={scss.formSection}>
          <div className={scss.sectionHeader}>
            <div>
              <Typography className={scss.sectionTitle} component="h2">
                Personal information
              </Typography>
              <Typography className={scss.sectionDescription}>
                Keep your profile information current for reporting, exports,
                and workspace notifications.
              </Typography>
            </div>
          </div>

          {!isEditable && (
            <div className={scss.readOnlyNotice}>
              <InfoOutlinedIcon fontSize="small" />
              <Typography component="span">
                This is the shared demo account, so editing is disabled here.
                Sign up for a real account to update your name and email.
              </Typography>
            </div>
          )}

          {saveError && (
            <Typography className={scss.saveErrorNotice} role="alert">
              {saveError}
            </Typography>
          )}

          <form className={scss.profileForm} onSubmit={handleSubmit}>
            <div className={scss.formGrid}>
              <TextField
                disabled={!isEditable || isSaving}
                fullWidth
                label="First name"
                name="firstName"
                onChange={handleFormChange}
                required
                size="small"
                sx={fieldStyles}
                value={visibleFormData.firstName}
              />

              <TextField
                disabled={!isEditable || isSaving}
                fullWidth
                label="Last name"
                name="lastName"
                onChange={handleFormChange}
                required
                size="small"
                sx={fieldStyles}
                value={visibleFormData.lastName}
              />

              <TextField
                className={scss.fullWidthField}
                disabled={!isEditable || isSaving}
                fullWidth
                label="Email"
                name="email"
                onChange={handleFormChange}
                required
                size="small"
                sx={fieldStyles}
                type="email"
                value={visibleFormData.email}
              />
            </div>

            <div className={scss.preferenceRow}>
              <div>
                <Typography className={scss.preferenceTitle}>
                Email updates
                </Typography>
                <Typography className={scss.preferenceDescription}>
                  Receive product updates, weekly performance summaries, and
                  account insights.
                </Typography>
              </div>
              <Checkbox
                checked={visibleFormData.receiveEmails}
                disabled={!isEditable}
                name="receiveEmails"
                onChange={handleFormChange}
                slotProps={{
                  input: { "aria-label": "Receive sales analytics emails" },
                }}
                sx={{
                  color: "text.secondary",
                  "&.Mui-checked": {
                    color: "secondary.main",
                  },
                  "&.Mui-focusVisible": {
                    outline: `3px solid ${alpha(theme.palette.secondary.main, 0.32)}`,
                    outlineOffset: 2,
                  },
                }}
              />
            </div>

            <div className={scss.formActions}>
              <Button
                className={scss.saveButton}
                disabled={!isEditable || isSaving}
                startIcon={<SaveOutlinedIcon />}
                type="submit"
                variant="contained"
              >
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </section>
      </Paper>

      <Footer />
    </main>
  );
}
