// ************* => 각 기수마다 고쳐야할 부분
const parse = require('csv-parse');
const fs = require('fs');

//초기화
fs.writeFileSync(`time.txt`,"");
fs.writeFileSync(`log.txt`,"");

const reportData = fs.readFileSync('./reports/report2.csv'); //**************기수에 해당하는 csv 불러와야함!!
const ParticipantsData = fs.readFileSync('./nameList.csv');
const firstDay = "2021.1.20"; // **************연수 시작 날짜 수정해야 함
const secondDay = "2021.1.21"; // *************연수 종료 날짜 수정해야함

//참가자 별 시간 조정 함수
//입장 시간 조정
const validStartTimeMaker = (entryTime, quitTime, log) => {
  if(entryTime < new Date(`${firstDay} 9:00`) && quitTime > new Date(`${firstDay} 9:00`)) {
    log[2] = `${firstDay} 9:00`;
  }
  else if(entryTime > new Date(`${firstDay} 11:50`) && entryTime < new Date(`${firstDay} 13:00`)) {
    log[2] = `${firstDay} 13:00`;
  }
  else if(entryTime > new Date(`${firstDay} 18:00`) && entryTime < new Date(`${firstDay} 23:00`)) {
    log[2] = 0;
    log[3] = 0;
  }
  else if(entryTime > new Date(`${secondDay} 7:00`) && entryTime < new Date(`${secondDay} 9:00`) && quitTime > new Date(`${secondDay} 9:00`)){
    log[2] = `${secondDay} 9:00`;
  }
  else if(entryTime > new Date(`${secondDay} 11:50`) && entryTime < new Date(`${secondDay} 13:00`)){
    log[2] = `${secondDay} 13:00`;
  }
  else if(entryTime > new Date(`${secondDay} 16:00`)){
    log[2] = 0;
    log[3] = 0;
  }
} ;

//퇴장 시간 조정
const validEndTimeMaker = (entryTime, quitTime, log) => {
  if(quitTime < new Date(`${firstDay} 9:00`)) {
    log[2] = 0
    log[3] = 0;
  }
  else if(quitTime > new Date(`${firstDay} 11:50`) && quitTime < new Date(`${firstDay} 13:00`)) {
    log[3] = `${firstDay} 11:50`;
  }
  else if(entryTime < new Date(`${firstDay} 18:00`) && quitTime > new Date(`${firstDay} 18:00`) && quitTime < new Date(`${firstDay} 23:00`)) {
    log[3] = `${firstDay} 18:00`;
  }
  else if(quitTime > new Date(`${secondDay} 7:00`) && quitTime < new Date(`${secondDay} 9:00`)){
    log[3] = 0;
    log[2] = 0;
  }
  else if(quitTime > new Date(`${secondDay} 11:50`) && quitTime < new Date(`${secondDay} 13:00`)){
    log[3] = `${secondDay} 11:50`;
  }
  else if(entryTime < new Date(`${secondDay} 16:00`) && quitTime > new Date(`${secondDay} 16:00`)){
    log[3] = `${secondDay} 16:00`;
  }
} ;

//점심 시간 70분 조정(점심시간이 입장과 퇴장 중간에 껴있으면 70분 빼기)
const lunchTimeRemover = (entryTime, quitTime, log) => {
  if(entryTime < new Date(`${firstDay} 11:50`) && quitTime > new Date(`${firstDay} 13:00`)){
    const quitTimeAdjustment = new Date(log[3]) - 70 * 60 * 1000; 
    log[3] = new Date(quitTimeAdjustment).toLocaleString();
  }
  else if(entryTime < new Date(`${secondDay} 11:50`) && quitTime > new Date(`${secondDay} 13:00`)){
    const quitTimeAdjustment = new Date(log[3]) - 70 * 60 * 1000; 
    log[3] = new Date(quitTimeAdjustment).toLocaleString();
  }
}
// [ t > new Date(`2021.1.20 9:00`), t < new Date(`2021.1.20 11:50`), t > new Date(`2021.1.20 13:00`), t < new Date(`2021.1.20 18:00`), t >  new Date(`2021.1.21 9:00`), t < new Date(`2021.1.21 12:00`), t > new Date(`2021.1.21 13:00`), t < new Date(`2021.1.21 16:00`)]

// 분임별로 따로 추출하기 위해 반복문 사용 분임 수는 8개라 8 사용
for(let i = 0; i < 8; i++){
  // 전체 연수생 리스트
  let participants = [];
  parse(ParticipantsData, (err, data) => {
    data.forEach(row => {
      if(row[0].includes(`2기`) && row[2].includes(`${i+1}`)) { //************기수 수정해야함!!**************
        participants.push(row);
      }
    });

    //줌 리포트 로그 분석
    parse(reportData, (err, data) => {
      //분임별로 로그 모으기
      let group1Logs = [];
      data.forEach(row => {
        row[0].includes(`${i+1}분임`) && group1Logs.push(row);
      });

      //연수생 별로 로그 기록 모으기
      let individualAttendanceLogs = [];
      participants.forEach( participant => {
        const participantName = participant[1].trim();
        let individualData = [];
        group1Logs.forEach( group1Log => {
          group1Log[0].includes(participantName) && individualData.push(group1Log);
        });
        individualData[0] && individualAttendanceLogs.push(individualData);
      });

      //점심, 자율연수 시간 제거 & 기록 작업
      individualAttendanceLogs.forEach( participant => {
        fs.appendFileSync(`log.txt`, `\n ${participant[0][0]} => \n`)
        let participantTimeSpan = 0;
        participant.forEach( log => {
          //원본 로그 작성
          fs.appendFileSync(`log.txt`, `------------------------------------------------------------ \n 원본 시간 \n 이름: ${log[0]}\n 입장 시간: ${log[2]} 퇴장 시간: ${log[3]} \n`)

          //순수 연수 시간 추출
          const entryTime = new Date(log[2]);
          const quitTime = new Date(log[3]);
          validStartTimeMaker(entryTime, quitTime, log);
          validEndTimeMaker(entryTime, quitTime, log);
          lunchTimeRemover(entryTime, quitTime, log);
          const logTimeSpan = new Date(log[3]) - new Date(log[2]);
          participantTimeSpan += logTimeSpan;

          //수정한 로그 작성
          fs.appendFileSync(`log.txt`, `조작 시간 \n 이름: ${log[0]}\n 입장 시간: ${log[2]} 퇴장 시간: ${log[3]} \n------------------------------------------------------------ \n`)
        });

        //연수생별 이수 시간 계산 후 작성
        // 미달 추정 연수생 표시
        if(participantTimeSpan/(1000 * 60) < 750){
          fs.appendFileSync(`time.txt`, `*****************************************************\n${participant[0][0]}\n=> ${participantTimeSpan/(1000 * 60)} 분\n*****************************************************\n\n`);
        }
        // 계정 두 개 이상으로 동시접속 추정 연수생 표시
        else if(participantTimeSpan/(1000 * 60) > 1000){
          fs.appendFileSync(`time.txt`, `------------------------------------------------------\n${participant[0][0]}\n=> ${participantTimeSpan/(1000 * 60)} 분\n------------------------------------------------------\n\n`);
        }
        else{
          fs.appendFileSync(`time.txt`, `${participant[0][0]}\n=> ${participantTimeSpan/(1000 * 60)} 분 \n\n`);
        };
      });
    });
  });
};