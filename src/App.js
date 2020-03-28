import React, { Component } from 'react';
import { compose } from 'recompose';
import RedditList from './components/RedditList';
import './App.css';
import List from './components/List';
import withLoading from './components/HOC/withLoading';
import withPaginated from './components/HOC/withPaginated';
import withInfiniteScroll from './components/HOC/withInfiniteScroll';

const applyUpdateResult = (results, page) => prevState => ({
  hits: [...prevState.hits, ...results],
  page: page,
  isError: false,
  isLoading: false,
  bottomPostName: results[results.length - 1].name
});

const applySetResult = (results, page) => prevState => ({
  hits: results,
  page: page,
  isError: false,
  isLoading: false,
  bottomPostName: results[results.length - 1].name
});

const applySetError = prevState => ({
  isError: true,
  isLoading: false
});

const getRedditUrl = (value, page, bottomPostName) => {
  value = value.replace(/\s/g,'');
  const pageParam = page ? `?count=25&after=${bottomPostName}` : '';
  return encodeURI(`https://old.reddit.com/r/${value}.json${pageParam}`);
}

const paginatedCondition = props => 
  props.page != null && !props.isLoading && props.isError;

const infiniteScrollCondition = props =>
  (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 250)
  && props.list.length
  && !props.isLoading
  && !props.isError;

const loadingCondition = props => props.isLoading;

const AdvancedList = compose(
  withPaginated(paginatedCondition),
  withInfiniteScroll(infiniteScrollCondition),
  withLoading(loadingCondition)
)(RedditList);

class App extends Component {
  state = {
    hits: null,
    page: null,
    isLoading: false,
    isError: false,
    bottomPostName: ''
  };
  inputRef = React.createRef();

  componentDidMount() {
    this.inputRef.current.focus();
  }

  onInitialSearch = e => {
    e.preventDefault();

    const { value } = this.inputRef.current;

    if (value === '') {
      return;
    }

    this.fetchStories(value, 0);
  }

  onPaginatedSearch = () => {
    this.fetchStories(this.inputRef.current.value, 
      this.state.page + 1, 
      this.state.bottomPostName);
  }

  onSetError = () =>
    this.setState(applySetError);

  fetchStories = (value, page, bottomPostName) => {
    this.setState({ isLoading: true });
    fetch(getRedditUrl(value, page, bottomPostName))
      .then(response => response.json())
      .then(json => json.data.children.map(c => c.data))
      .then(result => this.onSetResult(result, page))
      .catch(this.onSetError);
  }

  onSetResult = (results, page) => {
    page === 0 
      ? this.setState(applySetResult(results, page))
      : this.setState(applyUpdateResult(results, page));
  }

  render = () => {
    const { hits, isLoading, isError, page } = this.state;
    return (
      <div className="page">
        <div className="interactions">
          <form type="submit" onSubmit={this.onInitialSearch}>
            <input type="text" placeholder="Enter a subreddit" 
              ref={this.inputRef}/>
            <button type="submit">Go</button>
          </form>
        </div>
        <AdvancedList list={hits}
          isLoading={isLoading}
          isError={isError}
          page={page}
          onPaginatedSearch={this.onPaginatedSearch} />
      </div>
    );
  }
}

export default App;
