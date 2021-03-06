import { createStory, createExplicitNextCondition, createScrollWithDefault } from 'app/help/contract';
const focusVisualizationElement = () => jQuery('class-visualization');

export const focusVisualization = createStory({
  title: { key: 'Classes can be seen visually here' },
  scroll: createScrollWithDefault(focusVisualizationElement),
  popover: { element: focusVisualizationElement, position: 'left-down' },
  focus: { element: focusVisualizationElement },
  nextCondition: createExplicitNextCondition()
});
