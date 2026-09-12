import { useEffect, useRef, useState } from 'react'
import { Camera, Loader2, LogOut, Trash2 } from 'lucide-react'

import { LocaleFields } from '@/components/locale/LocaleFields'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'
import { compressImageFile } from '@/lib/imageUpload'
import { ApiError } from '@/lib/httpClient'
import { asPermissionList, hasWorkspacePermission } from '@/lib/workspacePermissions'
import { companyResource } from '@/services/company.service'
import { profileResource } from '@/services/profile.service'

function initials(name: string) {
  return (
    name
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  )
}

export function ProfilePanel() {
  const { logout } = useAuth()
  const { data: me, isLoading, isError, error } = profileResource.useGet()
  const { data: company } = companyResource.useGet()
  const updateProfile = profileResource.useUpdateProfile()
  const updateAvatar = profileResource.useUpdateAvatar()
  const changePassword = profileResource.useChangePassword()
  const updateLocale = profileResource.useUpdateLocale()
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('IN')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [savedCountry, setSavedCountry] = useState('IN')
  const [savedTimezone, setSavedTimezone] = useState('Asia/Kolkata')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saved, setSaved] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const canEditLocale = hasWorkspacePermission(asPermissionList(me?.permissions), 'settings', me?.role)

  useEffect(() => {
    if (!me) return
    setName(me.name)
    setPhone(me.phone ?? '')
  }, [me])

  useEffect(() => {
    if (!company) return
    const nextCountry = company.country || 'IN'
    const nextTimezone = company.timezone || 'Asia/Kolkata'
    setCountry(nextCountry)
    setTimezone(nextTimezone)
    setSavedCountry(nextCountry)
    setSavedTimezone(nextTimezone)
  }, [company])

  const handleSave = () => {
    setSaved(false)
    setFormError(null)
    const namePhoneChanged = name.trim() !== (me?.name ?? '') || phone !== (me?.phone ?? '')
    const localeChanged = canEditLocale && (country !== savedCountry || timezone !== savedTimezone)

    const saveLocale = () => {
      if (!localeChanged) {
        setSaved(true)
        return
      }
      updateLocale.mutate(
        { country, timezone },
        {
          onSuccess: (res) => {
            setSavedCountry(res.country || country)
            setSavedTimezone(res.timezone || timezone)
            setSaved(true)
          },
          onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Could not save locale'),
        }
      )
    }

    if (namePhoneChanged) {
      updateProfile.mutate(
        { name: name.trim(), phone: phone.trim() || null },
        {
          onSuccess: saveLocale,
          onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Save failed'),
        }
      )
      return
    }
    if (localeChanged) saveLocale()
  }

  const handlePassword = () => {
    setPasswordMessage(null)
    setFormError(null)
    if (newPassword.length < 8) {
      setFormError('New password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setFormError('New passwords do not match')
      return
    }
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
          setPasswordMessage('Password changed.')
        },
        onError: (err) =>
          setFormError(err instanceof ApiError ? err.message : 'Could not change password'),
      }
    )
  }

  const handleAvatar = async (file: File | null) => {
    if (!file) return
    setFormError(null)
    try {
      const compressed = await compressImageFile(file)
      updateAvatar.mutate(compressed, {
        onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Could not upload photo'),
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not process photo')
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-56" />
      </div>
    )
  }

  if (isError || !me) {
    return (
      <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-xl border p-4 text-sm">
        Couldn't load your profile: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    )
  }

  const saving = updateProfile.isPending || updateLocale.isPending

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Full name</Label>
              <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-email">Email</Label>
              <Input id="profile-email" value={me.email} disabled />
              <p className="text-muted-foreground text-xs">Contact support to change your email.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-phone">Phone</Label>
              <Input id="profile-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <LocaleFields
              idPrefix="profile"
              country={country}
              timezone={timezone}
              disabled={!canEditLocale}
              onCountryChange={setCountry}
              onTimezoneChange={setTimezone}
            />
            {!canEditLocale ? (
              <p className="text-muted-foreground text-xs">Ask a workspace admin to change country and timezone.</p>
            ) : null}
            {formError ? <p className="text-destructive text-xs">{formError}</p> : null}
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
              {saved ? <span className="text-channel-green text-xs font-medium">Saved</span> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Password</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowPasswordForm((v) => !v)}>
                {showPasswordForm ? 'Cancel' : 'Change password'}
              </Button>
            </div>
          </CardHeader>
          {showPasswordForm ? (
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              {passwordMessage ? <p className="text-channel-green text-xs">{passwordMessage}</p> : null}
              <Button size="sm" onClick={handlePassword} disabled={changePassword.isPending}>
                {changePassword.isPending ? 'Updating…' : 'Update password'}
              </Button>
            </CardContent>
          ) : null}
        </Card>
      </div>

      <Card className="h-fit">
        <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null
              e.target.value = ''
              void handleAvatar(file)
            }}
          />
          <button
            type="button"
            className="relative rounded-full"
            onClick={() => fileRef.current?.click()}
            aria-label="Change profile photo"
            disabled={updateAvatar.isPending}
          >
            <Avatar className="size-20">
              {me.avatar ? <AvatarImage src={me.avatar} alt="" /> : null}
              <AvatarFallback className="text-xl">{initials(me.name)}</AvatarFallback>
            </Avatar>
            <span className="bg-primary text-primary-foreground absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full">
              {updateAvatar.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
            </span>
          </button>
          <div>
            <p className="text-sm font-semibold">{me.name}</p>
            <p className="text-muted-foreground text-xs">{me.email}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge className="capitalize">{me.role}</Badge>
            {me.emailVerified ? <Badge variant="outline">Verified</Badge> : null}
          </div>
          {me.avatar ? (
            <Button
              variant="outline"
              size="sm"
              disabled={updateAvatar.isPending}
              onClick={() => updateAvatar.mutate(null)}
            >
              <Trash2 />
              Remove photo
            </Button>
          ) : null}
          <Separator />
          <Button variant="outline" size="sm" className="w-full" onClick={logout}>
            <LogOut />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
