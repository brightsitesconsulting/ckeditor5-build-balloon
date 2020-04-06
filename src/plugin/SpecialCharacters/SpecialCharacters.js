import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import Command from '@ckeditor/ckeditor5-core/src/command';
import omegaIcon from './omega.svg';

class AttributeCommand extends Command {
	constructor( editor, callback ) {
		super( editor );
		this.onPluginExecute = callback;
	}
	execute() {
		this.onPluginExecute();
	}
}

export default class SpecialCharaters extends Plugin {
	constructor( editor ) {
		super( editor );

		editor.config.define( 'specialCharacters', { callbacks: {} } );
	}
	init() {
		const editor = this.editor;

		const callbacks = editor.config.get( 'specialCharacters.callbacks' );

		const onExecutePlugin = ( cbs, currentEditor ) => () => {
			if ( !callbacks.searchSpecialCharactersRequested ) {
				throw new Error( 'No callback searchSpecialCharactersRequested provided' );
			}
			callbacks.searchSpecialCharactersRequested().then( data => {
				if ( !data ) {
					return;
				}

				const model = currentEditor.model;
				const selection = model.document.selection;
				model.change( writer => {
					writer.insertText( data, selection.getLastPosition(), 'after' );
				} );
			} ).catch( ex => {
				console.error( ex );
			} );
		};

		editor.commands.add( 'specialCharacters', new AttributeCommand( editor, onExecutePlugin( callbacks, editor ) ) );
		editor.ui.componentFactory.add( 'specialCharacters', locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: 'search special character',
				icon: omegaIcon,
				tooltip: true
			} );

			// Callback executed once the image is clicked.
			view.on( 'execute', onExecutePlugin( callbacks, editor ) );

			return view;
		} );
	}
}
