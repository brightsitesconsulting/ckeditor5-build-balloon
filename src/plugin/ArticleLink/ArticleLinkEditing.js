import LinkEditing from '@ckeditor/ckeditor5-link/src/linkediting';

export default class ArticleLinkEditing extends LinkEditing {
	constructor( editor ) {
		super( editor );
		console.log( 'Article Link' );
	}
}
