import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import linkIcon from './link.svg';
import AttributeCommand from '@ckeditor/ckeditor5-basic-styles/src/attributecommand';
import toMap from '@ckeditor/ckeditor5-utils/src/tomap';
import bindTwoStepCaretToAttribute from '@ckeditor/ckeditor5-engine/src/utils/bindtwostepcarettoattribute';

import findLinkRange from '@ckeditor/ckeditor5-link/src/findlinkrange';

const INTERNAL_LINK = 'href';
const ATTRIBUTE_WHITESPACES = /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205f\u3000]/g; // eslint-disable-line no-control-regex
const SAFE_URL = /^(?:(?:https?|ftps?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i;

export default class ArticleLink extends Plugin {
	constructor( editor ) {
		super( editor );

		editor.config.define( 'searchArticleLink', { callbacks: {} } );
	}
	init() {
		const editor = this.editor;
		const locale = editor.locale;

		const callbacks = editor.config.get( 'searchArticleLink.callbacks' );

		editor.ui.componentFactory.add( 'insertArticleLink', locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: 'search article link',
				icon: linkIcon,
				tooltip: true
			} );

			// Callback executed once the image is clicked.
			view.on( 'execute', () => {
				callbacks.searchArticleRequested().then( data => {
					if ( !data ) {
						return;
					}
					const { href, title } = data;
					const model = editor.model;
					const selection = model.document.selection;

					model.change( writer => {
						// If selection is collapsed then update selected link or insert new one at the place of caret.
						if ( selection.isCollapsed ) {
							const position = selection.getFirstPosition();

							// When selection is inside text with `linkHref` attribute.
							if ( selection.hasAttribute( INTERNAL_LINK ) ) {
								// Then update `linkHref` value.
								const linkRange = findLinkRange( position, selection.getAttribute( INTERNAL_LINK ), model );

								writer.setAttribute( INTERNAL_LINK, href, linkRange );

								// Create new range wrapping changed link.
								writer.setSelection( linkRange );
							}
							// If not then insert text node with `linkHref` attribute in place of caret.
							// However, since selection in collapsed, attribute value will be used as data for text node.
							// So, if `href` is empty, do not create text node.
							else if ( href !== '' ) {
								const attributes = toMap( selection.getAttributes() );

								attributes.set( INTERNAL_LINK, href );

								const node = writer.createText( href, attributes );

								model.insertContent( node, position );

								// Create new range wrapping created node.
								writer.setSelection( writer.createRangeOn( node ) );
							}
						} else {
							// If selection has non-collapsed ranges, we change attribute on nodes inside those ranges
							// omitting nodes where `linkHref` attribute is disallowed.
							const ranges = model.schema.getValidRanges( selection.getRanges(), INTERNAL_LINK );

							for ( const range of ranges ) {
								writer.setAttribute( INTERNAL_LINK, { href, title }, range );
							}
						}
					} );
				} ).catch( () => {

				} );
			} );

			return view;
		} );

		editor.model.schema.extend( '$text', { allowAttributes: INTERNAL_LINK } );
		editor.model.schema.setAttributeProperties( INTERNAL_LINK, {
			isFormatting: false,
			copyOnEnter: true
		} );

		editor.conversion.for( 'upcast' )
			.elementToAttribute( {
				view: {
					name: 'a',
					attributes: {
						href: true
					}
				},
				model: {
					key: INTERNAL_LINK,
					value: viewElement => {
						const keys = viewElement.getAttributeKeys();
						const data = {};
						for ( const key of keys ) {
							if ( !data[ key ] ) {
								data[ key ] = viewElement.getAttribute( key );
							}
						}
						return data;
					}
				}
			} );

		editor.conversion.for( 'editingDowncast' )
			.attributeToElement( {
				model: INTERNAL_LINK, view: ( data, writer ) => {
					if ( data ) {
						return createLinkElement( {
							...data,
							href: ensureSafeUrl( data.href )
						}, writer );
					}
				} } );

		editor.conversion.for( 'downcast' )
			.attributeToElement( { model: INTERNAL_LINK, view: ( data, writer ) => {
				if ( data ) {
					const element = writer.createAttributeElement( 'a', { ...data }, { priority: 5 } );
					writer.setCustomProperty( 'link', true, element );
					return element;
				}
			} } );

		editor.commands.add( INTERNAL_LINK, new AttributeCommand( editor, INTERNAL_LINK ) );

		bindTwoStepCaretToAttribute( {
			view: editor.editing.view,
			model: editor.model,
			emitter: this,
			attribute: 'linkHref',
			locale
		} );
	}
}

function createLinkElement( data, writer ) {
	// Priority 5 - https://github.com/ckeditor/ckeditor5-link/issues/121.
	const linkElement = writer.createAttributeElement( 'a', { ...data }, { priority: 5 } );
	writer.setCustomProperty( 'link', true, linkElement );

	return linkElement;
}

function ensureSafeUrl( url ) {
	url = String( url );

	return isSafeUrl( url ) ? url : '#';
}

function isSafeUrl( url ) {
	const normalizedUrl = url.replace( ATTRIBUTE_WHITESPACES, '' );

	return normalizedUrl.match( SAFE_URL );
}
