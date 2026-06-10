import * as stylex from '@stylexjs/stylex';
import { useState, type Ref } from 'react';
import { styles } from './AddressSearch.stylex';

interface AddressSearchProps {
  onSearch: (postcode: string) => void;
  isLoading: boolean;
  inputReference?: Ref<HTMLInputElement>;
}

export const AddressSearch = ({ onSearch, isLoading, inputReference }: AddressSearchProps) => {
  const [postcode, setPostcode] = useState('');
  const [showValidationError, setShowValidationError] = useState(false);

  // Debouncing is not currently required because onSearch only fires on form submission.
  // When autocomplete functionality is added in the future, consider using the useDebounce hook
  // to debounce API calls triggered by input changes. This pattern ensures that autocomplete
  // requests are debounced and prevents excessive API calls on every keystroke.

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedPostcode = postcode.trim();
    if (!trimmedPostcode) {
      setShowValidationError(true);
      return;
    }

    setShowValidationError(false);
    onSearch(trimmedPostcode.toUpperCase());
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPostcode(event.target.value);
    if (showValidationError && event.target.value.trim()) {
      setShowValidationError(false);
    }
  };

  return (
    <form {...stylex.props(styles.form)} onSubmit={handleSubmit}>
      <p {...stylex.props(styles.description)}>
        Powered by AI and geospatial data. Enter any UK postcode to instantly generate a property risk assessment covering flood, fire, and subsidence risk.
      </p>
      <label {...stylex.props(styles.label)} htmlFor="postcode-search">
        Enter a UK postcode
      </label>
      <div {...stylex.props(styles.inputWrapper)}>
        <input
          {...stylex.props(styles.input)}
          id="postcode-search"
          ref={inputReference}
          type="text"
          value={postcode}
          onChange={handleInputChange}
          placeholder="e.g. SW1A 1AA"
          disabled={isLoading}
          autoFocus
          aria-invalid={showValidationError}
          aria-describedby={showValidationError ? 'postcode-search-error' : undefined}
        />
        <button
          {...stylex.props(styles.button)}
          type="submit"
          disabled={isLoading}
        >
          Check risk
        </button>
      </div>
      {showValidationError && (
        <div {...stylex.props(styles.errorMessage)} id="postcode-search-error">
          Please enter a postcode.
        </div>
      )}
    </form>
  );
};
