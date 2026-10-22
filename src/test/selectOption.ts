import { screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

/** Pick an option of the custom Select: open its list, then click the option. */
export async function chooseOption(user: UserEvent, combobox: HTMLElement, optionName: string): Promise<void> {
  await user.click(combobox);
  await user.click(await screen.findByRole('option', { name: optionName }));
}
