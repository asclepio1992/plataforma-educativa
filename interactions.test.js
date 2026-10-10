const {test}=require('node:test'),assert=require('node:assert/strict');
const {academicSummary,publicSlides,answeredCorrect}=require('./academic');
test('verdadero/falso conserva claves privadas y cuenta aciertos por afirmación',()=>{
 const slide={id:'vf',type:'quiz',quizKind:'truefalse',title:'Caso',statements:[{text:'Primera',correct:true},{text:'Segunda',correct:false}],background:'data:image/png;base64,AA=='};
 const room={slides:[slide],index:0,answers:{vf:{ana:{values:[true,true]}}}};
 const publicSlide=publicSlides(room)[0];assert.deepEqual(publicSlide.statements,[{text:'Primera'},{text:'Segunda'}]);assert.equal(publicSlide.background,slide.background);
 const summary=academicSummary(room,{id:'ana'});assert.equal(summary.correct,1);assert.equal(summary.evaluated,2);assert.equal(summary.answered,1);assert.equal(summary.mastery,'Intermedio');assert.equal(answeredCorrect(slide,{values:[true,false]}),true);assert.equal(answeredCorrect(slide,{values:[true]}),false);
 assert.equal(answeredCorrect({quizKind:'truefalse',correct:1},{choice:1}),true);
});
