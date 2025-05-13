// components/CreateProfileForm.tsx
'use client';

import { useState } from 'react';
import { useCreateProfile, CreateProfileArgs } from '@lens-protocol/react-web';
import { useAccount } from 'wagmi';

interface CreateProfileFormProps {
  onProfileCreated: (profileId: string) => void; // Callback after successful creation
  ownerAddress?: string; // Optionally pass if different from connected wallet
}

export default function CreateProfileForm({ onProfileCreated, ownerAddress }: CreateProfileFormProps) {
  const [localName, setLocalName] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const { address: connectedAddress } = useAccount();

  const { execute: createProfile, error: createError, isPending } = useCreateProfile();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);

    if (!localName.trim()) {
      setFeedback('Please enter a desired handle name.');
      return;
    }
    if (!/^[a-z0-9_]{3,30}$/.test(localName)) {
      setFeedback('Handle can only contain lowercase letters, numbers, underscores, and be 3-30 characters long.');
      return;
    }

    const profileOwner = ownerAddress || connectedAddress;
    if (!profileOwner) {
        setFeedback('Wallet not connected or owner address not provided.');
        return;
    }

    try {
      // For a truly minimal profile creation, metadataURI can be omitted.
      // The SDK might default to a basic profile or allow setting metadata later.
      // For a slightly better UX, you could create basic metadata here.
      // Example:
      // import { profile as createProfileMetadata } from '@lens-protocol/metadata';
      // import { upload } from '@lens-protocol/client'; // You'd need this for metadata upload
      // const metadata = createProfileMetadata({ name: localName, bio: `My Lens profile: @${localName}` });
      // const metadataUri = await upload(metadata); // This would be an async step

      const args: CreateProfileArgs = {
        localName: localName.trim(),
        to: profileOwner, // The owner of the new profile
        // metadataURI: metadataUri, // Optional: if you upload metadata
        // followPolicy: anyone(), // Optional: defaults to Anyone can follow
      };

      console.log("Attempting to create profile with args:", args);
      const result = await createProfile(args);

      if (result.isSuccess()) {
        setFeedback(`✅ Profile @${localName} created successfully! TX: ${result.value.txHash}. It might take a moment to appear.`);
        // The result.value might contain the profile ID or transaction details
        // For now, we just signal success. The parent component will refetch profiles.
        console.log("Profile creation successful:", result.value);
        // Assuming result.value contains profileId or we can infer it
        // This is speculative, actual profile ID might not be directly in result.value.
        // The parent component should refetch managed profiles.
        onProfileCreated(result.value.profileId || "unknown_profile_id_check_sdk_docs");
        setLocalName(''); // Clear input
      } else {
        console.error('Profile creation failed:', result.error);
        setFeedback(`❌ Error creating profile: ${result.error.message}`);
      }
    } catch (err: any) {
      console.error('Unexpected error creating profile:', err);
      setFeedback(`❌ Unexpected error: ${err.message}`);
    }
  };

  return (
    <div className="my-4 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 shadow">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Create Your Lens Profile</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="localName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Desired Handle (e.g., yourname)
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400">
              @
            </span>
            <input
              type="text"
              name="localName"
              id="localName"
              className="focus:ring-purple-500 focus:border-purple-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400 p-2"
              placeholder="yourcoolhandle"
              value={localName}
              onChange={(e) => setLocalName(e.target.value.toLowerCase())}
              disabled={isPending}
              maxLength={30}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">This will become @yourhandle.lens (or .test)</p>
        </div>

        {feedback && (
          <p className={`text-sm p-2 rounded ${feedback.startsWith('✅') ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200' : 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200'}`}>
            {feedback}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending || !localName.trim()}
          className="w-full btn btn-primary bg-purple-600 hover:bg-purple-700 disabled:opacity-50 py-2"
        >
          {isPending ? 'Creating Profile...' : 'Create Profile'}
        </button>
      </form>
    </div>
  );
}
