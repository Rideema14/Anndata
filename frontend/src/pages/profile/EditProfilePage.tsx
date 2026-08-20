import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { TextField } from '@/components/common/FormField'
import { useAuth } from '@/context/AuthContext'

function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

export default function EditProfilePage() {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')

  if (!user) return null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await updateProfile({ name, phone })
    navigate('/profile')
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:px-6 md:py-8">
      <Link to="/profile" className="mb-4 flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Profile
      </Link>

      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
          {initials(name || user.name)}
        </span>
        <div>
          <h1 className="text-lg">Edit Profile</h1>
          <p className="text-xs text-ink-400">Photo upload will connect once media storage is available.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <TextField id="name" label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <TextField id="phone" label="Phone Number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <p className="mb-4 text-xs text-ink-400">
          Email ({user.email}) and address are managed separately — visit{' '}
          <Link to="/profile" className="font-semibold text-brand-600 hover:underline">
            Addresses
          </Link>{' '}
          to update where you're located.
        </p>
        <Button type="submit" fullWidth>
          Save Changes
        </Button>
      </form>
    </div>
  )
}
