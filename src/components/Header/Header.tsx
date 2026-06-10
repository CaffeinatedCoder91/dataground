import * as stylex from '@stylexjs/stylex';
import { styles } from './Header.stylex';

export const Header = () => {
  return (
    <header {...stylex.props(styles.container)}>
      <h1 {...stylex.props(styles.title)}>Property Risk Checker</h1>
      <p {...stylex.props(styles.subtitle)}>
        Enter a UK postcode to generate an AI-powered risk assessment
      </p>
    </header>
  );
};
