import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';
import { buildShareUrl } from '../../utils/buildShareUrl';
import { styles } from './ShareButton.stylex';

interface ShareButtonProps {
  postcode: string;
}

export const ShareButton = ({ postcode }: ShareButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      const shareUrl = buildShareUrl(postcode);
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);

      const timeoutId = setTimeout(() => {
        setIsCopied(false);
      }, 2000);

      return () => clearTimeout(timeoutId);
    } catch {
      // Silently fail if clipboard API is not available
    }
  };

  return (
    <button
      {...stylex.props(styles.button)}
      onClick={handleCopyLink}
      type="button"
    >
      {isCopied ? 'Link copied!' : 'Share result'}
    </button>
  );
};
