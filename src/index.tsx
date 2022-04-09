import React from "react";
import ReactDOM from "react-dom";
import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  ApolloProvider,
  from,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { v4 as uuidv4 } from "uuid";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { GET_USERS, GET_MESSAGES } from "./graphql/fragments";

const httpLink = new HttpLink({
  uri: "https://srb5q.sse.codesandbox.io/",
});

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  const { cache } = operation.getContext();

  if (graphQLErrors) {
    graphQLErrors.map(({ message }) =>
      console.log(`GraphQL Error: ${message}`)
    );
  }

  if (networkError) {
    console.log(`Network Error: ${networkError.message}`);
  }

  if (
    (graphQLErrors || networkError) &&
    operation.operationName === "AddMessage" &&
    !operation.variables.isRetry
  ) {
    const { users } = cache.readQuery({ query: GET_USERS });
    const { messages } = cache.readQuery({ query: GET_MESSAGES });

    const createdBy = users.find(
      ({ id }: { id: string }) => id === operation.variables.userId
    );

    cache.writeQuery({
      query: GET_MESSAGES,
      data: {
        messages: [
          ...messages,
          {
            __typename: "Message",
            id: `ERROR/${uuidv4()}`,
            text: operation.variables.text,
            createdBy: {
              id: operation.variables.userId,
              ...createdBy,
            },
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });
  }
});

const client = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache(),
});

ReactDOM.render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
