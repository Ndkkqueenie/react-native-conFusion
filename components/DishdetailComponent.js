import React, { Component } from 'react';
import { View, Text, ScrollView, FlatList, Modal, StyleSheet, Button ,Alert, PanResponder, Share} from 'react-native';
import { Card, Icon, Rating, Input } from 'react-native-elements';
import { connect } from 'react-redux';
import { baseUrl } from '../shared/baseUrl';
import { postFavorite } from '../redux/ActionCreators';
import { postComment } from '../redux/ActionCreators';
import * as Animatable from 'react-native-animatable';

const mapStateToProps = state => {
  return {
    dishes: state.dishes,
    comments: state.comments,
    favorites: state.favorites
  }
}

const mapDispatchToProps = dispatch => ({
  postFavorite: (dishId) => dispatch(postFavorite(dishId)),
  postComment: (dishId, rating, author, comment) => dispatch(postComment(dishId, rating, author, comment))
});

function RenderDish(props) {
  const dish = props.dish;

  const handleViewRef= (ref) => {this.view = ref;};

  const recognizeDrag=({moveX,moveY,dx,dy})=>{
      if(dx<-200)
        return true;
      else
        return false;
  }
  const recognizeComment = ({ moveX, moveY, dx, dy }) => {
    if (dx > 200)
      return true;
    else
      return false;
  };
  //social sharing
  const shareDish = (title, message, url) => {
    Share.share({
        title: title,
        message: title + ': ' + message + ' ' + url,
        url: url
    },{
        dialogTitle: 'Share ' + title
    })
}
  const panResponder=PanResponder.create({
      onStartShouldSetPanResponder:(e,gestureState)=>{
          return true;
      },
      onPanResponderGrant:()=>{
        this.view.rubberBand(1000)
            .then(endState=>console.log(endState.finished?'finished':'cancelled'));
      },
      onPanResponderEnd:(e,gestureState)=>{
          if(recognizeDrag(gestureState)){
                Alert.alert(
                    'Add to favourites?',
                    'Are you sure you wish to add '+dish.name+' to your favourites',
                    [
                        {
                            text:'Cancel',
                            onPress:()=>console.log('Cancel Pressed'),
                            style:'cancel'
                        },
                        {
                            text:'OK',
                            onPress:()=>props.favorite ? console.log('Already favorite') : props.onPress()
                        }
                    ],
                    { cancelable: false }
                )
                } else if (recognizeComment(gestureState)) {
                    props.toggleCommentModal();
                  }
          return true;
      }
  })

  if (dish != null) {
    return(
    <Animatable.View animation="fadeInDown" duration={2000} delay={1000}
        ref={handleViewRef}
        {...panResponder.panHandlers}
    >
      <Card
          featuredTitle={dish.name}
          image={{uri: baseUrl + dish.image}}>
          <Text style={{margin: 10}}>
              {dish.description}
          </Text>
          <View style={{flexDirection: 'row', justifyContent: 'center',}}>
            <Icon
              raised
              reverse
              name={ props.favorite ? 'heart' : 'heart-o'}
              type='font-awesome'
              color='#f50'
              onPress={() => props.favorite ? console.log('Already favorite') : props.onPress()}
            />
            <Icon
              raised
              reverse
              name='pencil'
              type='font-awesome'
              color='#512DA8'
              onPress={() => props.toggleCommentModal() }
            />
            <Icon
              raised
              reverse
              name='share'
              type='font-awesome'
              color='#51D2A8'
              style={styles.cardItem}
              onPress={() => shareDish(dish.name, dish.description, baseUrl + dish.image)} 
            />
          </View>
      </Card>
    </Animatable.View>

    );
  } else {
    return(<View></View>);
  }
}

function RenderComments(props) {
  const comments = props.comments;

  const renderCommentItem = ({item, index}) => {

      return (
          <View key={index} style={{margin: 10}}>
              <Text style={{fontSize: 14}}>{item.comment}</Text>
              <Rating
                readonly
                ratingCount={5}
                imageSize={15}
                style={{paddingVertical: 5, flexDirection: 'row', justifyContent: 'flex-start'}}
                startingValue={item.rating}
              />
              <Text style={{fontSize: 12}}>{'-- ' + item.author + ', ' + item.date} </Text>
          </View>
      );
  };


  return(
    <Animatable.View animation="fadeInUp" duration={2000} delay={1000}>
    <Card title="Comments">
      <FlatList
        data={comments}
        renderItem={renderCommentItem}
        keyExtractor={item => item.id.toString()}
      />
    </Card>
    </Animatable.View>
  );
}


class Dishdetail extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showCommentModal: false,
      rating: 1,
      author: '',
      comment: ''
    }

    this.toggleCommentModal = this.toggleCommentModal.bind(this);
    this.ratingCompleted = this.ratingCompleted.bind(this);
  }

  markFavorite(dishId) {
    //console.log("DishID: " + dishId);
    this.props.postFavorite(dishId);
  }

  toggleCommentModal() {
    this.setState({ showCommentModal: !this.state.showCommentModal });
  }

  ratingCompleted(rating) {
    this.setState({
      'rating': rating
    });
  }

  handleComment(dishId) {
    // Close modal window
    this.toggleCommentModal();

    // Post to reducer
    this.props.postComment(dishId, this.state.rating, this.state.author, this.state.comment);
  }

  static navigationOptions = {
    title: 'Dish Details'
  }

  render() {
    const { dishId } = this.props.route.params;

    return(
      <ScrollView>
          <RenderDish dish={this.props.dishes.dishes[+dishId]}
              favorite={this.props.favorites.some(el => el === dishId)}
              onPress={() => this.markFavorite(dishId)}
              toggleCommentModal={this.toggleCommentModal}
              />
          <RenderComments comments={this.props.comments.comments.filter((comment) => comment.dishId === dishId)} />
          <Modal animationType = {"slide"} transparent = {false}
                    visible = {this.state.showCommentModal}
                    onRequestClose = {() => this.toggleModal() }>
                    <View style = {styles.formRow}>
                    <Rating
                        type='custom'
                        ratingCount={5}
                        imageSize={30}
                        showRating
                        startingValue={this.state.rating}
                        onFinishRating={this.ratingCompleted}
                    />
                    </View>
                    <View style = {styles.formRow}>
                       <Input
                            placeholder='  Author'
                            value={this.state.author}
                            onChangeText={(text) => this.setState({author: text})}
                            leftIcon={
                                <Icon
                                    name='user-o'
                                    type='font-awesome'
                                    size={18}
                                    color='black'
                                    
                                />
                            }
                        />
                    </View>
                    <View style = {styles.formRow}> 
                        <Input
                            placeholder='  Comment'
                            value={this.state.comment}
                            onChangeText={(text) => this.setState({comment: text})}
                            leftIcon={
                                <Icon
                                    name='comment-o'
                                    type='font-awesome'
                                    size={18}
                                    color='black'
                                />
                            }
                        />
                    </View>
                    <View style = {styles.formButton}>
                        <Button 
                            onPress={() => { this.handleComment(dishId); } }
                            color="#512DA8"
                            title="Submit" 
                        />
                    </View>
                    <View style = {styles.formButton}>
                        <Button 
                            onPress={() => { this.toggleCommentModal(); } }
                            color="grey"
                            title="Cancel" 
                        />    
                    </View>
                </Modal>
      </ScrollView>
    );
  }


}

const styles = StyleSheet.create({
    formRow: {
      alignItems: 'center',
      justifyContent: 'center',
      margin: 10
    },
    formButton: {
        alignItems: 'stretch',
        margin: 10
    },
    formItem: {
        flex: 1
    }, 
    modal: {
        justifyContent: 'center',
        margin: 20
     }
});


export default connect(mapStateToProps, mapDispatchToProps)(Dishdetail);