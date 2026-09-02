import {
  GraphQLError,
  Kind,
  type SelectionSetNode,
  type ValidationRule,
} from 'graphql';

export const maxDepthRule = (maxDepth: number): ValidationRule => {
  return (context) => {
    return {
      Document: {
        enter(node) {
          let max = 0;

          const walk = (
            depth: number,
            selectionSet: SelectionSetNode
          ): void => {
            for (const selection of selectionSet.selections) {
              if (selection.kind === Kind.FIELD) {
                const next = depth + 1;
                if (next > max) {
                  max = next;
                }
                if (selection.selectionSet) {
                  walk(next, selection.selectionSet);
                }
              } else if (
                selection.kind === Kind.INLINE_FRAGMENT &&
                selection.selectionSet
              ) {
                walk(depth, selection.selectionSet);
              } else if (selection.kind === Kind.FRAGMENT_SPREAD) {
                const fragment = context.getFragment(selection.name.value);
                if (fragment?.selectionSet) {
                  walk(depth, fragment.selectionSet);
                }
              }
            }
          };

          for (const definition of node.definitions) {
            if (
              definition.kind === Kind.OPERATION_DEFINITION &&
              definition.selectionSet
            ) {
              walk(0, definition.selectionSet);
            }
          }

          if (max > maxDepth) {
            context.reportError(
              new GraphQLError(
                `Слишком глубокий GraphQL-запрос (макс. ${maxDepth})`
              )
            );
          }
        },
      },
    };
  };
};
