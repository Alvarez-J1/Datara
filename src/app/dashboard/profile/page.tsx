"use client";

import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
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
import { useSession } from "next-auth/react";
import { type ChangeEvent, type FormEvent, useState } from "react";
import scss from "./Profile.module.scss";

type ProfileFormData = {
  confirmPassword: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  receiveEmails: boolean;
};

const getProfileDefaults = (
  name?: string | null,
  email?: string | null
): ProfileFormData => {
  const names = name ? name.split(" ") : [];

  return {
    confirmPassword: "",
    email: email || "",
    firstName: names[0] || "",
    lastName: names.length > 1 ? names[names.length - 1] : "",
    password: "",
    receiveEmails: false,
  };
};

export default function Profile() {
  const { data: session } = useSession();
  const theme = useTheme();
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState<Partial<ProfileFormData>>({
    confirmPassword: "",
    password: "",
    receiveEmails: false,
  });
  const sessionDefaults = getProfileDefaults(
    session?.user?.name,
    session?.user?.email
  );
  const visibleFormData: ProfileFormData = {
    ...sessionDefaults,
    ...formData,
    confirmPassword: formData.confirmPassword ?? "",
    password: formData.password ?? "",
    receiveEmails: formData.receiveEmails ?? false,
  };

  const handleFormChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;

    setSaved(false);
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaved(true);
    console.log("Profile saved:", visibleFormData);
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
              alt={session?.user?.name || "User"}
              className={scss.avatar}
              src={session?.user?.image || ""}
              sx={{
                height: 96,
                width: 96,
              }}
            />
            <span className={scss.avatarStatus} aria-label="Active user" />
          </div>

          <div>
            <Typography className={scss.profileName}>
              {session?.user?.name || "Datara user"}
            </Typography>
            <Typography className={scss.profileRole}>
            Revenue analytics dashboard
            </Typography>
          </div>

          <div className={scss.metaList}>
            <div className={scss.metaItem}>
              <EmailOutlinedIcon fontSize="small" />
              <span>{session?.user?.email || "No email available"}</span>
            </div>
            <div className={scss.metaItem}>
              <ShieldOutlinedIcon fontSize="small" />
              <span>Google OAuth protected</span>
            </div>
            <div className={scss.metaItem}>
              <BadgeOutlinedIcon fontSize="small" />
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

          <form className={scss.profileForm} onSubmit={handleSubmit}>
            <div className={scss.formGrid}>
              <TextField
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

              <TextField
                fullWidth
                label="Password"
                name="password"
                onChange={handleFormChange}
                required
                size="small"
                sx={fieldStyles}
                type="password"
                value={visibleFormData.password}
              />

              <TextField
                fullWidth
                label="Confirm password"
                name="confirmPassword"
                onChange={handleFormChange}
                required
                size="small"
                sx={fieldStyles}
                type="password"
                value={visibleFormData.confirmPassword}
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
                startIcon={<SaveOutlinedIcon />}
                type="submit"
                variant="contained"
              >
                Save changes
              </Button>
            </div>
          </form>
        </section>
      </Paper>

      <Footer />
    </main>
  );
}
