import { module as mod }  from './module';
export default mod.name;

import { InteractiveHelpService } from './services/interactiveHelpService';
import { InteractiveHelpModelService } from './services/helpModelService';
import { InteractiveHelpUserService } from './services/helpUserService';
import { InteractiveHelpVisualizationService } from './services/helpVisualizationService';
import { LibraryCreationStoryLine } from './libraryCreationHelpStoryLine';

mod.service('interactiveHelpService', InteractiveHelpService);
mod.service('helpModelService', InteractiveHelpModelService);
mod.service('helpVisualizationService', InteractiveHelpVisualizationService);
mod.service('helpUserService', InteractiveHelpUserService);

mod.service('libraryCreationStoryLine', LibraryCreationStoryLine);
