import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { getGroupedMatches } from '../../src/services/tradeApi';
import { GroupedMatchesResponse } from '../../src/types/trade';
import { router } from 'expo-router';

export default function MatchesScreen() {
  const [groups, setGroups] = useState<GroupedMatchesResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = () => {
    setLoading(true);
    getGroupedMatches()
      .then(setGroups)
      .catch(()=> setGroups([]))
      .finally(()=> setLoading(false));
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator /></View>;
  }

  if (!groups.length) {
    return <View style={styles.center}><Text style={{ color:'#666' }}>Nessun match ancora</Text></View>;
  }

  return (
    <View style={{ flex:1, padding:16 }}>
      <Text style={styles.title}>I tuoi Scambi</Text>
      <FlatList
        data={groups}
        keyExtractor={g => g.otherUser._id}
        renderItem={({ item }) => {
          const isOpen = expanded[item.otherUser._id];
          return (
            <View style={styles.groupBox}>
              <TouchableOpacity
                style={styles.groupHeader}
                onPress={() => setExpanded(s => ({ ...s, [item.otherUser._id]: !isOpen }))}
              >
                <Image
                  source={{ uri: item.otherUser.avatarUrl || 'https://placehold.co/60x60' }}
                  style={styles.avatar}
                />
                <View style={{ flex:1 }}>
                  <Text style={styles.nickname}>{item.otherUser.nickname}</Text>
                  <Text style={styles.meta}>
                    {item.aggregate.matchCount} scambi • {item.aggregate.unreadTotal} non letti
                  </Text>
                </View>
                <Text style={styles.chevron}>{isOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {isOpen && (
                <View style={styles.matchesWrap}>
                  {item.matches.map(m => (
                    <TouchableOpacity
                      key={m.matchId}
                      style={styles.matchChip}
                      onPress={() => router.push(`/chats/${m.matchId}`)}
                    >
                      <View style={styles.imagesRow}>
                        {m.itemMine?.imageUrl &&
                          <Image source={{ uri: m.itemMine.imageUrl }} style={styles.itemImg} />}
                        {m.itemTheirs?.imageUrl &&
                          <Image source={{ uri: m.itemTheirs.imageUrl }} style={[styles.itemImg, { marginLeft: -12, borderWidth:2, borderColor:'#fff' }]} />}
                      </View>
                      <Text numberOfLines={1} style={styles.chipTxt}>
                        {m.itemMine?.title} ↔ {m.itemTheirs?.title}
                      </Text>
                      {m.unread > 0 && <View style={styles.unreadDot}><Text style={styles.unreadTxt}>{m.unread}</Text></View>}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center:{ flex:1, justifyContent:'center', alignItems:'center' },
  title:{ fontSize:22, fontWeight:'600', marginBottom:12 },
  groupBox:{ backgroundColor:'#f7f7f9', borderRadius:14, marginBottom:14, overflow:'hidden' },
  groupHeader:{ flexDirection:'row', alignItems:'center', padding:12 },
  avatar:{ width:50, height:50, borderRadius:25, marginRight:12, backgroundColor:'#ddd' },
  nickname:{ fontSize:16, fontWeight:'600' },
  meta:{ fontSize:12, color:'#666', marginTop:2 },
  chevron:{ fontSize:16, color:'#555', marginLeft:8 },
  matchesWrap:{ flexDirection:'row', flexWrap:'wrap', padding:10, gap:10 },
  matchChip:{
    width:150, backgroundColor:'#fff', borderRadius:12, padding:8, shadowColor:'#000',
    shadowOpacity:0.08, shadowRadius:4, position:'relative'
  },
  imagesRow:{ flexDirection:'row', marginBottom:6 },
  itemImg:{ width:40, height:40, borderRadius:8, backgroundColor:'#eee' },
  chipTxt:{ fontSize:12, fontWeight:'500' },
  unreadDot:{
    position:'absolute', top:6, right:6, backgroundColor:'#FF4D4F', minWidth:20, height:20,
    paddingHorizontal:4, borderRadius:10, alignItems:'center', justifyContent:'center'
  },
  unreadTxt:{ color:'#fff', fontSize:11, fontWeight:'600' }
});