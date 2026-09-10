import type { Meta, StoryObj } from '@storybook/angular';
import { CraftOverview } from './overview';

// Демо-страница «все токены и компоненты» для приёмки дизайнером и
// методистом (план 03-design-system.md, §6). Переключайте Module/Density/
// Surface в тулбаре сверху — акцент и плотность меняются на этой же странице.
const meta: Meta<CraftOverview> = {
  title: 'Foundations/Overview',
  component: CraftOverview,
  parameters: {
    a11y: { test: 'error' },
  },
};

export default meta;
type Story = StoryObj<CraftOverview>;

export const AllTokensAndComponents: Story = {};
