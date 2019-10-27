import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import IICon from './i.svg';
import AttributeCommand from '@ckeditor/ckeditor5-basic-styles/src/attributecommand';

const ILETTER = 'iLetter';

class InsertINewsLetter extends Plugin {
	init() {
		const editor = this.editor;
		const t = editor.t;

		editor.ui.componentFactory.add( ILETTER, locale => {
			const command = editor.commands.get( ILETTER );
			const view = new ButtonView( locale );

			view.set( {
				label: t( 'I Letter' ),
				icon: IICon,
				keystroke: 'CTRL+SHIFT+I',
				tooltip: true,
				isToggleable: true
			} );

			view.bind( 'isOn', 'isEnabled' ).to( command, 'value', 'isEnabled' );

			// Execute command.
			this.listenTo( view, 'execute', () => editor.execute( ILETTER ) );

			return view;
		} );

		editor.model.schema.extend( '$text', { allowAttributes: ILETTER } );
		editor.model.schema.setAttributeProperties( ILETTER, {
			isFormatting: true,
			copyOnEnter: true
		} );

		editor.conversion.attributeToElement( {
			model: ILETTER,
			view: {
				name: 'span',
				classes: 'inews-letter',
				styles: {
					color: '#CF351C'
				}
			}
		} );

		editor.commands.add( ILETTER, new AttributeCommand( editor, ILETTER ) );

		// Set the Ctrl+B keystroke.
		editor.keystrokes.set( 'CTRL+SHIFT+I', ILETTER );
	}
}

export default InsertINewsLetter;
