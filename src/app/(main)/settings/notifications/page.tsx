"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

interface NotificationPrefs {
  emailNotificationsEnabled: boolean;
  emailOnMessage: boolean;
  emailOnVerification: boolean;
  emailOnKarma: boolean;
}

export default function NotificationSettingsPage() {
  const preferences = useQuery(api.notifications.getMyNotificationPreferences);
  const updatePreferences = useMutation(api.notifications.updateMyNotificationPreferences);

  const [formState, setFormState] = useState<NotificationPrefs>({
    emailNotificationsEnabled: true,
    emailOnMessage: true,
    emailOnVerification: true,
    emailOnKarma: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!preferences) return;
    setFormState(preferences);
  }, [preferences]);

  const isDisabled = !formState.emailNotificationsEnabled;

  const hasChanges = useMemo(() => {
    if (!preferences) return false;
    return (
      preferences.emailNotificationsEnabled !== formState.emailNotificationsEnabled ||
      preferences.emailOnMessage !== formState.emailOnMessage ||
      preferences.emailOnVerification !== formState.emailOnVerification ||
      preferences.emailOnKarma !== formState.emailOnKarma
    );
  }, [preferences, formState]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaved(false);
    setSaving(true);
    try {
      await updatePreferences(formState);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  if (preferences === undefined) {
    return (
      <div className="h-full overflow-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-wvsu-border bg-white p-6 text-sm text-wvsu-muted">
          Loading notification settings...
        </div>
      </div>
    );
  }

  if (preferences === null) {
    return (
      <div className="h-full overflow-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-wvsu-border bg-white p-6 text-sm text-red-600">
          You must be signed in to edit notification settings.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="rounded-2xl border border-wvsu-border bg-white p-5 sm:p-6">
          <h1 className="font-display text-2xl text-wvsu-blue">Notification Settings</h1>
          <p className="mt-1 text-sm text-wvsu-muted">
            Control which email alerts you receive from WVSU LF.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-wvsu-border bg-white p-5 sm:p-6 space-y-4">
          <label className="flex items-start justify-between gap-3 rounded-xl border border-wvsu-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-wvsu-blue">Enable email notifications</p>
              <p className="text-xs text-wvsu-muted">Turn all email notifications on or off.</p>
            </div>
            <input
              type="checkbox"
              checked={formState.emailNotificationsEnabled}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  emailNotificationsEnabled: event.target.checked,
                }))
              }
              className="mt-1 h-4 w-4 accent-wvsu-blue"
            />
          </label>

          <label className="flex items-start justify-between gap-3 rounded-xl border border-wvsu-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-wvsu-blue">New message emails</p>
              <p className="text-xs text-wvsu-muted">Receive an email when someone sends you a message.</p>
            </div>
            <input
              type="checkbox"
              checked={formState.emailOnMessage}
              disabled={isDisabled}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  emailOnMessage: event.target.checked,
                }))
              }
              className="mt-1 h-4 w-4 accent-wvsu-blue disabled:opacity-50"
            />
          </label>

          <label className="flex items-start justify-between gap-3 rounded-xl border border-wvsu-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-wvsu-blue">Verification updates</p>
              <p className="text-xs text-wvsu-muted">Receive an email when a claim is accepted or rejected.</p>
            </div>
            <input
              type="checkbox"
              checked={formState.emailOnVerification}
              disabled={isDisabled}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  emailOnVerification: event.target.checked,
                }))
              }
              className="mt-1 h-4 w-4 accent-wvsu-blue disabled:opacity-50"
            />
          </label>

          <label className="flex items-start justify-between gap-3 rounded-xl border border-wvsu-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-wvsu-blue">Karma activity</p>
              <p className="text-xs text-wvsu-muted">Receive an email when you earn karma points.</p>
            </div>
            <input
              type="checkbox"
              checked={formState.emailOnKarma}
              disabled={isDisabled}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  emailOnKarma: event.target.checked,
                }))
              }
              className="mt-1 h-4 w-4 accent-wvsu-blue disabled:opacity-50"
            />
          </label>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-wvsu-muted">
              Message emails are rate-limited to reduce spam during fast chats.
            </p>
            <button
              type="submit"
              disabled={saving || !hasChanges}
              className="rounded-xl bg-wvsu-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-wvsu-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save preferences"}
            </button>
          </div>

          {saved ? (
            <p className="text-xs font-medium text-green-600">Notification preferences updated.</p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
