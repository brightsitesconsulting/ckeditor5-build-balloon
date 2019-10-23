import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

import ArticleLinkEditing from './ArticleLinkEditing';
import ArticleLinkUI from './ArticleLinkUI';

export default class Link extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ ArticleLinkEditing, ArticleLinkUI ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'ArticleLink';
	}
}

