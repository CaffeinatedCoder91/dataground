import * as stylex from '@stylexjs/stylex';
import { styles } from './RecentSearches.stylex';

interface RecentSearchesProps {
  recentSearches: string[];
  onSelect: (postcode: string) => void;
  onClear: () => void;
}

export const RecentSearches = ({
  recentSearches,
  onSelect,
  onClear,
}: RecentSearchesProps) => {
  if (recentSearches.length === 0) {
    return null;
  }

  return (
    <div {...stylex.props(styles.container)}>
      <label {...stylex.props(styles.label)}>Recent searches</label>
      <div {...stylex.props(styles.chipContainer)}>
        {recentSearches.map((postcode) => (
          <button
            key={postcode}
            {...stylex.props(styles.chip)}
            onClick={() => onSelect(postcode)}
            type="button"
          >
            {postcode}
          </button>
        ))}
      </div>
      <button
        {...stylex.props(styles.clearButton)}
        onClick={onClear}
        type="button"
      >
        Clear
      </button>
    </div>
  );
};
